import { NextResponse } from 'next/server';
import { areAllProjectAgreementsSigned } from '@/lib/portal-agreement-data';
import { getPortalSession } from '@/lib/portal-auth';
import {
  hasClientAgreementForConsultation,
  resolveConsultationRequestIdForProject,
} from '@/lib/client-agreement-store';
import { portalUserOwnsProject } from '@/lib/portal-project-access';
import { listProjectAgreementsForPortalUser } from '@/lib/project-agreement-store';
import { createPortalSupportMessage, getPortalSupportThread } from '@/lib/portal-support';
import { portalSupportMessageSchema } from '@/lib/portal-support-schema';
import {
  checkRateLimit,
  formatRetryAfter,
  getClientIp,
  isPortalRateLimitEnabled,
} from '@/lib/rate-limit';

export const runtime = 'nodejs';

async function resolveOwnedProjectId(portalUserId: string, projectId: string | undefined) {
  const trimmed = projectId?.trim();
  if (!trimmed) {
    return {
      error: NextResponse.json({ ok: false, error: 'Project is required' }, { status: 400 }),
    };
  }

  if (!(await portalUserOwnsProject(portalUserId, trimmed))) {
    return {
      error: NextResponse.json({ ok: false, error: 'Project not found' }, { status: 404 }),
    };
  }

  return { projectId: trimmed };
}

async function requireSignedProjectAgreements(portalUserId: string, projectId: string) {
  const consultationRequestId = await resolveConsultationRequestIdForProject(portalUserId, projectId);
  if (!consultationRequestId) {
    return {
      error: NextResponse.json({ ok: false, error: 'Project not found' }, { status: 404 }),
    };
  }

  if (!(await hasClientAgreementForConsultation(consultationRequestId))) {
    return {
      error: NextResponse.json(
        {
          ok: false,
          error: 'Sign the Client Service Agreement for this consultation before sending messages.',
        },
        { status: 403 }
      ),
    };
  }

  const agreements = await listProjectAgreementsForPortalUser(portalUserId, projectId);
  if (!areAllProjectAgreementsSigned(agreements)) {
    return {
      error: NextResponse.json(
        {
          ok: false,
          error: 'Sign all project agreements before sending messages for this project.',
        },
        { status: 403 }
      ),
    };
  }

  return { ok: true as const };
}

export async function GET(request: Request) {
  const session = await getPortalSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'You must be signed in' }, { status: 401 });
  }

  const queryProjectId = new URL(request.url).searchParams.get('projectId') ?? undefined;
  const project = await resolveOwnedProjectId(session.userId, queryProjectId);
  if ('error' in project && project.error) {
    return project.error;
  }

  const thread = await getPortalSupportThread(session.userId, project.projectId);

  return NextResponse.json({
    ok: true,
    progressId: thread.progressId,
    messages: thread.messages,
  });
}

export async function POST(request: Request) {
  const session = await getPortalSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'You must be signed in' }, { status: 401 });
  }

  const ip = getClientIp(request.headers);
  if (isPortalRateLimitEnabled()) {
    const burst = checkRateLimit(`portal-support:${session.userId}:${ip}`, 20, 15 * 60 * 1000);
    if (!burst.allowed) {
      const retry = formatRetryAfter(burst.retryAfterSeconds);
      return NextResponse.json(
        { ok: false, error: `Too many messages. Please try again in ${retry}.` },
        { status: 429, headers: { 'Retry-After': String(burst.retryAfterSeconds) } }
      );
    }
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = portalSupportMessageSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Invalid message';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }

  const project = await resolveOwnedProjectId(session.userId, parsed.data.projectId);
  if ('error' in project && project.error) {
    return project.error;
  }

  const signed = await requireSignedProjectAgreements(session.userId, project.projectId);
  if ('error' in signed && signed.error) {
    return signed.error;
  }

  try {
    const result = await createPortalSupportMessage(
      session.userId,
      parsed.data.body,
      project.projectId
    );
    return NextResponse.json({
      ok: true,
      progressId: result.progressId,
      message: result.message,
    });
  } catch (error) {
    console.error('Failed to save portal support message:', error);
    return NextResponse.json(
      { ok: false, error: 'Could not send your message. Please try again later.' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { areAllProjectAgreementsSigned } from '@/lib/portal-agreement-data';
import { getPortalSession } from '@/lib/portal-auth';
import {
  hasClientAgreementForConsultation,
  resolveConsultationRequestIdForProject,
} from '@/lib/client-agreement-store';
import { isPortalAdminRole } from '@/lib/portal-role-data';
import { listProjectAgreementsForPortalUser } from '@/lib/project-agreement-store';
import {
  createPortalClientSupportMessage,
  createPortalProviderSupportMessage,
  getPortalSupportThread,
  resolvePortalSupportProjectForSession,
} from '@/lib/portal-support';
import { portalSupportMessageSchema } from '@/lib/portal-support-schema';
import {
  checkRateLimit,
  formatRetryAfter,
  getClientIp,
  isPortalRateLimitEnabled,
} from '@/lib/rate-limit';

export const runtime = 'nodejs';

function jsonError(message: string, status: number) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

async function requireSignedProjectAgreements(portalUserId: string, projectId: string) {
  const consultationRequestId = await resolveConsultationRequestIdForProject(portalUserId, projectId);
  if (!consultationRequestId) {
    return jsonError('Project not found', 404);
  }

  if (!(await hasClientAgreementForConsultation(consultationRequestId))) {
    return jsonError(
      'Sign the Client Service Agreement for this consultation before sending messages.',
      403
    );
  }

  const agreements = await listProjectAgreementsForPortalUser(portalUserId, projectId);
  if (!areAllProjectAgreementsSigned(agreements)) {
    return jsonError('Sign all project agreements before sending messages for this project.', 403);
  }

  return null;
}

export async function GET(request: Request) {
  const session = await getPortalSession();
  if (!session) {
    return jsonError('You must be signed in', 401);
  }

  const queryProjectId = new URL(request.url).searchParams.get('projectId') ?? undefined;
  const access = await resolvePortalSupportProjectForSession(session, queryProjectId);
  if (!access.ok) {
    return jsonError(access.error, access.status);
  }

  const thread = await getPortalSupportThread(access.clientPortalUserId, access.projectId);

  return NextResponse.json({
    ok: true,
    progressId: thread.progressId,
    messages: thread.messages,
  });
}

export async function POST(request: Request) {
  const session = await getPortalSession();
  if (!session) {
    return jsonError('You must be signed in', 401);
  }

  const ip = getClientIp(request.headers);
  if (isPortalRateLimitEnabled()) {
    const burst = checkRateLimit(`portal-support:${session.userId}:${ip}`, 20, 15 * 60 * 1000);
    if (!burst.allowed) {
      const retry = formatRetryAfter(burst.retryAfterSeconds);
      return jsonError(`Too many messages. Please try again in ${retry}.`, 429);
    }
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid request body', 400);
  }

  const parsed = portalSupportMessageSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Invalid message';
    return jsonError(message, 400);
  }

  const access = await resolvePortalSupportProjectForSession(session, parsed.data.projectId);
  if (!access.ok) {
    return jsonError(access.error, access.status);
  }

  const isAdmin = isPortalAdminRole(session.role);

  if (!isAdmin) {
    const agreementError = await requireSignedProjectAgreements(session.userId, access.projectId);
    if (agreementError) {
      return agreementError;
    }
  }

  try {
    const result = isAdmin
      ? await createPortalProviderSupportMessage(access.projectId, parsed.data.body)
      : await createPortalClientSupportMessage(access.projectId, parsed.data.body);

    return NextResponse.json({
      ok: true,
      progressId: result.progressId,
      message: result.message,
    });
  } catch (error) {
    console.error('Failed to save portal support message:', error);
    return jsonError('Could not send your message. Please try again later.', 500);
  }
}

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import {
  createProjectForConsultation,
  createProjectForConsultationInputSchema,
  CreateProjectForConsultationError,
} from '@/lib/portal-admin-create-project';
import { getPortalAdminClientCategoryCounts } from '@/lib/portal-admin-consultations';
import { getPortalSession } from '@/lib/portal-auth';
import { getPortalAppUrl } from '@/lib/portal-password-reset';
import { sendPortalProjectCreatedEmail } from '@/lib/portal-project-created-email';
import { isPortalAdminRole } from '@/lib/portal-role-data';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const session = await getPortalSession();

  if (!session) {
    return NextResponse.json({ ok: false, error: 'You must be signed in' }, { status: 401 });
  }

  if (!isPortalAdminRole(session.role)) {
    return NextResponse.json({ ok: false, error: 'Admin access required' }, { status: 403 });
  }

  const { id: consultationId } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = createProjectForConsultationInputSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Invalid project details';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }

  try {
    const { project, portalUserId, temporaryPassword, clientEmail, clientName } =
      await createProjectForConsultation(consultationId, parsed.data);

    const mail = await sendPortalProjectCreatedEmail({
      to: clientEmail,
      name: clientName,
      projectTitle: project.title,
      portalUrl: getPortalAppUrl(request),
      projectId: project.id,
      temporaryPassword,
    });

    const emailSent = mail.ok;
    const emailSkipped = !mail.ok && Boolean(mail.skipped);

    if (!mail.ok && !mail.skipped) {
      console.error('Project created notification email failed:', mail.error);
    }

    revalidatePath('/portal/admin', 'layout');

    const categoryCounts = await getPortalAdminClientCategoryCounts();

    return NextResponse.json({
      ok: true,
      projectId: project.id,
      projectTitle: project.title,
      portalUserId,
      temporaryPassword,
      consultationRequestId: project.consultationRequestId,
      emailSent,
      emailSkipped,
      categoryCounts,
    });
  } catch (error) {
    if (error instanceof CreateProjectForConsultationError) {
      const status =
        error.code === 'NOT_FOUND' ? 404 : error.code === 'ALREADY_HAS_PROJECT' ? 409 : 400;
      return NextResponse.json({ ok: false, error: error.message }, { status });
    }

    throw error;
  }
}

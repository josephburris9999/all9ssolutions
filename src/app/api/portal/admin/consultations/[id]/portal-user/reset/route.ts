import { NextResponse } from 'next/server';
import {
  PortalUserProvisionError,
  resetPortalUserCredentialsForConsultation,
} from '@/lib/portal-provision-user';
import { PORTAL_DEFAULT_CLIENT_PASSWORD } from '@/lib/portal-default-password';
import { getPortalSession } from '@/lib/portal-auth';
import { getPortalAppUrl } from '@/lib/portal-password-reset';
import { sendPortalTemporaryCredentialsEmail } from '@/lib/portal-reset-email';
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

  const { id } = await context.params;

  try {
    const result = await resetPortalUserCredentialsForConsultation(id);

    const mail = await sendPortalTemporaryCredentialsEmail({
      to: result.clientEmail,
      name: result.clientName,
      temporaryPassword: PORTAL_DEFAULT_CLIENT_PASSWORD,
      portalUrl: getPortalAppUrl(request),
    });

    if (!mail.ok && !mail.skipped) {
      console.error('Portal credentials reset email failed:', mail.error);
    }

    return NextResponse.json({
      ok: true,
      portalUserId: result.portalUserId,
      password: PORTAL_DEFAULT_CLIENT_PASSWORD,
      emailSent: mail.ok,
      emailSkipped: mail.ok ? false : Boolean(mail.skipped),
    });
  } catch (error) {
    if (error instanceof PortalUserProvisionError) {
      const status = error.code === 'NOT_FOUND' ? 404 : 409;
      return NextResponse.json({ ok: false, error: error.message }, { status });
    }

    throw error;
  }
}

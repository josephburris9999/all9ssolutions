import { NextResponse } from 'next/server';
import { buildProjectAgreementPdfForClient } from '@/lib/portal-agreement-document';
import { agreementPdfDownloadFilename } from '@/lib/portal-agreement-filename';
import { getPortalSession } from '@/lib/portal-auth';
import { getProjectAgreementForPortalUser } from '@/lib/project-agreement-store';
import { getClientAgreementTimeZone, getPortalClientProfile } from '@/lib/portal-user';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await getPortalSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'You must be signed in' }, { status: 401 });
  }

  const { id } = await context.params;
  const agreement = await getProjectAgreementForPortalUser(id, session.userId);

  if (!agreement) {
    return NextResponse.json({ ok: false, error: 'Agreement not found' }, { status: 404 });
  }

  const pdf = await buildProjectAgreementPdfForClient({
    clientProfile: await getPortalClientProfile(session.userId, session.email),
    projectAgreementId: id,
    portalUserId: session.userId,
    timeZone: await getClientAgreementTimeZone(session.userId),
  });

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${agreementPdfDownloadFilename(agreement.title)}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}

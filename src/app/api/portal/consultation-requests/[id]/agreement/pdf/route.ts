import { NextResponse } from 'next/server';
import { buildPortalAgreementPdfForClient } from '@/lib/portal-agreement-document';
import { PORTAL_CLIENT_SERVICE_AGREEMENT_PDF_FILENAME } from '@/lib/portal-agreement-filename';
import { getPortalSession } from '@/lib/portal-auth';
import { portalUserOwnsConsultationRequest } from '@/lib/client-agreement-store';
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

  const { id: consultationRequestId } = await context.params;

  if (!(await portalUserOwnsConsultationRequest(session.userId, consultationRequestId))) {
    return NextResponse.json({ ok: false, error: 'Consultation not found' }, { status: 404 });
  }

  const pdf = await buildPortalAgreementPdfForClient({
    clientProfile: await getPortalClientProfile(session.userId, session.email),
    consultationRequestId,
    timeZone: await getClientAgreementTimeZone(session.userId, consultationRequestId),
  });

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${PORTAL_CLIENT_SERVICE_AGREEMENT_PDF_FILENAME}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}

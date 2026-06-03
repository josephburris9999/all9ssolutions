import { NextResponse } from 'next/server';
import { buildPortalAgreementPdfForClient, consultationProfileFromRequest } from '@/lib/portal-agreement-document';
import { PORTAL_CLIENT_SERVICE_AGREEMENT_PDF_FILENAME } from '@/lib/portal-agreement-filename';
import { getPortalSession } from '@/lib/portal-auth';
import { isPortalAdminRole } from '@/lib/portal-role-data';
import { getClientAgreementTimeZone } from '@/lib/portal-user';
import { prisma } from '@/lib/prisma';
import { isValidIanaTimeZone } from '@/lib/timezones';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await getPortalSession();

  if (!session) {
    return NextResponse.json({ ok: false, error: 'You must be signed in' }, { status: 401 });
  }

  if (!isPortalAdminRole(session.role)) {
    return NextResponse.json({ ok: false, error: 'Admin access required' }, { status: 403 });
  }

  const { id } = await context.params;

  const consultation = await prisma.consultationRequest.findUnique({
    where: { id },
    select: {
      name: true,
      email: true,
      company: true,
      phone: true,
      timezone: true,
      portalUserId: true,
    },
  });

  if (!consultation) {
    return NextResponse.json({ ok: false, error: 'Consultation not found' }, { status: 404 });
  }

  const clientProfile = consultationProfileFromRequest(consultation);
  const consultationTimezone = consultation.timezone?.trim();

  const pdf = await buildPortalAgreementPdfForClient({
    clientProfile,
    consultationRequestId: id,
    timeZone:
      consultationTimezone && isValidIanaTimeZone(consultationTimezone)
        ? consultationTimezone
        : consultation.portalUserId
          ? await getClientAgreementTimeZone(consultation.portalUserId, id)
          : await getClientAgreementTimeZone(consultation.portalUserId, id),
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

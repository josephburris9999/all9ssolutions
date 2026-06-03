import { NextResponse } from 'next/server';
import { buildProjectAgreementPdfForClient, consultationProfileFromRequest } from '@/lib/portal-agreement-document';
import { getPortalSession } from '@/lib/portal-auth';
import { isPortalAdminRole } from '@/lib/portal-role-data';
import { getProjectAgreementRecordForAdminPdf } from '@/lib/project-agreement-store';
import { getClientAgreementTimeZone } from '@/lib/portal-user';
import { prisma } from '@/lib/prisma';
import { isValidIanaTimeZone } from '@/lib/timezones';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{ id: string; agreementId: string }>;
};

function agreementPdfFilename(title: string): string {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

  return `all9s-${slug || 'project-agreement'}.pdf`;
}

export async function GET(_request: Request, context: RouteContext) {
  const session = await getPortalSession();

  if (!session) {
    return NextResponse.json({ ok: false, error: 'You must be signed in' }, { status: 401 });
  }

  if (!isPortalAdminRole(session.role)) {
    return NextResponse.json({ ok: false, error: 'Admin access required' }, { status: 403 });
  }

  const { id, agreementId } = await context.params;

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

  if (!consultation?.portalUserId) {
    return NextResponse.json({ ok: false, error: 'Consultation not found' }, { status: 404 });
  }

  const record = await getProjectAgreementRecordForAdminPdf(agreementId, id);

  if (!record) {
    return NextResponse.json({ ok: false, error: 'Agreement not found' }, { status: 404 });
  }

  const clientProfile = consultationProfileFromRequest(consultation);
  const consultationTimezone = consultation.timezone?.trim();
  const timeZone =
    consultationTimezone && isValidIanaTimeZone(consultationTimezone)
      ? consultationTimezone
      : await getClientAgreementTimeZone(consultation.portalUserId, id);

  const agreement = await prisma.projectAgreement.findUnique({
    where: { id: agreementId },
    select: { title: true },
  });

  const pdf = await buildProjectAgreementPdfForClient({
    clientProfile,
    projectAgreementId: agreementId,
    portalUserId: consultation.portalUserId,
    timeZone,
  });

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${agreementPdfFilename(agreement?.title ?? 'project-agreement')}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}

import 'server-only';

import {
  buildPortalAgreementStatus,
  formatPortalSignedAt,
  getPortalAgreementSectionsForClient,
  PORTAL_AGREEMENT_VERSION,
} from '@/lib/portal-agreement';
import { getClientAgreementByConsultationRequestId } from '@/lib/client-agreement-store';
import { buildPortalAgreementPdf, buildProjectAgreementBodyPdf, type AgreementPdfSignature } from '@/lib/portal-agreement-pdf';
import { prisma } from '@/lib/prisma';
import { getClientAgreementTimeZone, type PortalClientProfile } from '@/lib/portal-user';

export async function buildPortalAgreementPdfForClient(options: {
  clientProfile: PortalClientProfile;
  consultationRequestId: string;
  timeZone?: string | null;
}): Promise<Buffer> {
  const agreement = await getClientAgreementByConsultationRequestId(options.consultationRequestId);

  const agreementTimeZone =
    options.timeZone ??
    agreement?.signedTimeZone?.trim() ??
    (await getClientAgreementTimeZone(undefined, options.consultationRequestId)) ??
    'UTC';

  const status = buildPortalAgreementStatus(agreement);

  const signedAtLabel =
    status.signed && status.signedAt ? formatPortalSignedAt(status.signedAt, agreementTimeZone) : null;

  const signature: AgreementPdfSignature | undefined =
    status.signed && status.signerName && signedAtLabel
      ? {
          signerName: status.signerName,
          clientEmail: options.clientProfile.email,
          signedAtLabel,
          agreementVersion: status.agreementVersion ?? PORTAL_AGREEMENT_VERSION,
        }
      : undefined;

  const sections = getPortalAgreementSectionsForClient({
    client: options.clientProfile,
    timeZone: agreementTimeZone,
    signature:
      status.signed && status.signerName && status.signedAt && signedAtLabel
        ? { signerName: status.signerName, signedAt: status.signedAt, signedAtLabel }
        : undefined,
  });

  return buildPortalAgreementPdf(sections, signature);
}

export function consultationProfileFromRequest(request: {
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  timezone?: string | null;
  preferredContact?: string | null;
}): PortalClientProfile {
  const timezone = request.timezone?.trim();
  const preferredContact = request.preferredContact === 'p' ? 'p' : request.preferredContact === 'e' ? 'e' : null;

  return {
    name: request.name.trim(),
    email: request.email.trim(),
    company: request.company?.trim() || null,
    phone: request.phone?.trim() || null,
    timezone: timezone && timezone.length > 0 ? timezone : null,
    preferredContact,
  };
}

export async function buildProjectAgreementPdfForClient(options: {
  clientProfile: PortalClientProfile;
  projectAgreementId: string;
  portalUserId: string;
  timeZone?: string | null;
}): Promise<Buffer> {
  const record = await prisma.projectAgreement.findFirst({
    where: {
      id: options.projectAgreementId,
      project: { portalUserId: options.portalUserId },
    },
    select: {
      title: true,
      body: true,
      documentVersion: true,
      signerName: true,
      signedAt: true,
      signedTimeZone: true,
      status: true,
    },
  });

  if (!record) {
    throw new Error('Agreement not found');
  }

  const agreementTimeZone =
    options.timeZone ??
    record.signedTimeZone?.trim() ??
    (await getClientAgreementTimeZone(options.portalUserId)) ??
    'UTC';

  const signed =
    record.status === 'SIGNED' &&
    record.signedAt != null &&
    record.signerName != null;

  const status = {
    signed,
    signerName: record.signerName,
    signedAt: record.signedAt?.toISOString() ?? null,
    agreementVersion: record.documentVersion,
    currentVersion: record.documentVersion,
  };

  const signedAtLabel =
    status.signed && status.signedAt
      ? formatPortalSignedAt(status.signedAt, agreementTimeZone)
      : null;

  const signature: AgreementPdfSignature | undefined =
    status.signed && status.signerName && signedAtLabel
      ? {
          signerName: status.signerName,
          clientEmail: options.clientProfile.email,
          signedAtLabel,
          agreementVersion: status.agreementVersion ?? PORTAL_AGREEMENT_VERSION,
        }
      : undefined;

  return buildProjectAgreementBodyPdf({
    title: record.title,
    body: record.body,
    documentVersion: record.documentVersion,
    signature,
  });
}

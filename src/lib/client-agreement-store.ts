import 'server-only';

import { buildPortalAgreementStatus, PORTAL_AGREEMENT_TITLE, type PortalAgreementStatus } from '@/lib/portal-agreement';
import {
  buildClientServiceAgreementId,
  type PortalAgreementListItem,
} from '@/lib/portal-agreement-data';
import { prisma } from '@/lib/prisma';

export const clientAgreementSelect = {
  signedAt: true,
  signerName: true,
  version: true,
  signedTimeZone: true,
} as const;

export type ClientAgreementRecord = {
  signedAt: Date;
  signerName: string;
  version: string;
  signedTimeZone: string | null;
};

export async function getClientAgreementByConsultationRequestId(
  consultationRequestId: string
): Promise<ClientAgreementRecord | null> {
  return prisma.clientAgreement.findUnique({
    where: { consultationRequestId },
    select: clientAgreementSelect,
  });
}

export async function getClientAgreementStatusForConsultation(
  consultationRequestId: string
): Promise<PortalAgreementStatus> {
  const agreement = await getClientAgreementByConsultationRequestId(consultationRequestId);
  return buildPortalAgreementStatus(agreement);
}

export async function hasClientAgreementForConsultation(
  consultationRequestId: string
): Promise<boolean> {
  const agreement = await prisma.clientAgreement.findUnique({
    where: { consultationRequestId },
    select: { id: true },
  });

  return agreement != null;
}

export async function signClientAgreementForConsultation(
  consultationRequestId: string,
  data: {
    signerName: string;
    signedAt: Date;
    version: string;
    signedTimeZone: string | null;
  }
): Promise<ClientAgreementRecord> {
  return prisma.clientAgreement.create({
    data: {
      consultationRequestId,
      signerName: data.signerName,
      signedAt: data.signedAt,
      version: data.version,
      signedTimeZone: data.signedTimeZone,
    },
    select: clientAgreementSelect,
  });
}

/** Per-consultation Client Service Agreement for portal agreement lists. */
export async function getClientServiceAgreementListItem(
  consultationRequestId: string
): Promise<PortalAgreementListItem> {
  const agreement = await getClientAgreementByConsultationRequestId(consultationRequestId);

  return {
    id: buildClientServiceAgreementId(consultationRequestId),
    kind: 'client',
    title: PORTAL_AGREEMENT_TITLE,
    consultationRequestId,
    projectId: null,
    projectTitle: null,
    status: buildPortalAgreementStatus(agreement, agreement?.version),
  };
}

export async function listClientServiceAgreementsForPortalUser(
  portalUserId: string,
  consultationRequestId?: string | null
): Promise<PortalAgreementListItem[]> {
  if (consultationRequestId) {
    return [await getClientServiceAgreementListItem(consultationRequestId)];
  }

  const consultations = await prisma.consultationRequest.findMany({
    where: {
      OR: [{ portalUserId }, { projects: { some: { portalUserId } } }],
    },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    select: { id: true },
  });

  return Promise.all(consultations.map((row) => getClientServiceAgreementListItem(row.id)));
}

export async function portalUserOwnsConsultationRequest(
  portalUserId: string,
  consultationRequestId: string
): Promise<boolean> {
  const row = await prisma.consultationRequest.findFirst({
    where: {
      id: consultationRequestId,
      OR: [{ portalUserId }, { projects: { some: { portalUserId } } }],
    },
    select: { id: true },
  });

  return row != null;
}

export async function resolveConsultationRequestIdForProject(
  portalUserId: string,
  projectId: string
): Promise<string | null> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, portalUserId },
    select: { consultationRequestId: true },
  });

  return project?.consultationRequestId ?? null;
}

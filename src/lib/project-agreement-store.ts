import 'server-only';

import { PORTAL_AGREEMENT_VERSION } from '@/lib/portal-agreement';
import type { PortalAgreementListItem } from '@/lib/portal-agreement-data';
import {
  getClientServiceAgreementListItem,
  listClientServiceAgreementsForPortalUser,
  resolveConsultationRequestIdForProject,
} from '@/lib/client-agreement-store';
import { prisma } from '@/lib/prisma';

const projectAgreementSelect = {
  id: true,
  projectId: true,
  title: true,
  body: true,
  documentVersion: true,
  status: true,
  signerName: true,
  signedAt: true,
  signedTimeZone: true,
  createdAt: true,
  project: { select: { title: true, portalUserId: true } },
} as const;

function mapProjectAgreementRow(row: {
  id: string;
  projectId: string;
  title: string;
  body: string;
  documentVersion: string;
  status: 'PENDING' | 'SIGNED';
  signerName: string | null;
  signedAt: Date | null;
  signedTimeZone: string | null;
  project: { title: string; portalUserId: string };
}): PortalAgreementListItem {
  const signed =
    row.status === 'SIGNED' && row.signedAt != null && row.signerName != null;

  return {
    id: row.id,
    kind: 'project',
    title: row.title,
    body: row.body,
    consultationRequestId: null,
    projectId: row.projectId,
    projectTitle: row.project.title,
    status: {
      signed,
      signerName: row.signerName,
      signedAt: row.signedAt?.toISOString() ?? null,
      agreementVersion: row.documentVersion,
      currentVersion: row.documentVersion,
    },
  };
}

export async function listProjectAgreementsForPortalUser(
  portalUserId: string,
  projectId?: string | null
): Promise<PortalAgreementListItem[]> {
  const rows = await prisma.projectAgreement.findMany({
    where: {
      project: { portalUserId },
      ...(projectId ? { projectId } : {}),
    },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    select: projectAgreementSelect,
  });

  return rows.map(mapProjectAgreementRow);
}

/** Client Service Agreement(s) plus project agreements for admin / legacy dashboard views. */
export async function listPortalAgreementsForUser(
  portalUserId: string,
  projectId?: string | null
): Promise<PortalAgreementListItem[]> {
  const consultationRequestId = projectId
    ? await resolveConsultationRequestIdForProject(portalUserId, projectId)
    : null;

  const [clientAgreements, projectAgreements] = await Promise.all([
    listClientServiceAgreementsForPortalUser(portalUserId, consultationRequestId),
    listProjectAgreementsForPortalUser(portalUserId, projectId),
  ]);

  return [...clientAgreements, ...projectAgreements];
}

/** Agreements on the client project workspace: consultation CSA + that project's customized agreements. */
export async function listPortalAgreementsForClientProject(
  portalUserId: string,
  projectId: string
): Promise<PortalAgreementListItem[]> {
  const consultationRequestId = await resolveConsultationRequestIdForProject(portalUserId, projectId);
  if (!consultationRequestId) {
    return listProjectAgreementsForPortalUser(portalUserId, projectId);
  }

  const [clientAgreement, projectAgreements] = await Promise.all([
    getClientServiceAgreementListItem(consultationRequestId),
    listProjectAgreementsForPortalUser(portalUserId, projectId),
  ]);

  return [clientAgreement, ...projectAgreements];
}

export async function createProjectAgreement(input: {
  projectId: string;
  title: string;
  body: string;
  documentVersion?: string;
}) {
  const row = await prisma.projectAgreement.create({
    data: {
      projectId: input.projectId,
      title: input.title.trim(),
      body: input.body.trim(),
      documentVersion: input.documentVersion?.trim() || PORTAL_AGREEMENT_VERSION,
      status: 'PENDING',
    },
    select: projectAgreementSelect,
  });

  return mapProjectAgreementRow(row);
}

export async function getProjectAgreementForPortalUser(
  projectAgreementId: string,
  portalUserId: string
) {
  const row = await prisma.projectAgreement.findFirst({
    where: { id: projectAgreementId, project: { portalUserId } },
    select: projectAgreementSelect,
  });

  return row ? mapProjectAgreementRow(row) : null;
}

export async function signProjectAgreementForUser(
  projectAgreementId: string,
  portalUserId: string,
  data: {
    signerName: string;
    signedAt: Date;
    signedTimeZone: string | null;
  }
) {
  const existing = await prisma.projectAgreement.findFirst({
    where: { id: projectAgreementId, project: { portalUserId } },
    select: { id: true, status: true },
  });

  if (!existing) {
    return null;
  }

  if (existing.status === 'SIGNED') {
    throw new Error('ALREADY_SIGNED');
  }

  const updated = await prisma.projectAgreement.update({
    where: { id: projectAgreementId },
    data: {
      status: 'SIGNED',
      signerName: data.signerName,
      signedAt: data.signedAt,
      signedTimeZone: data.signedTimeZone,
    },
    select: projectAgreementSelect,
  });

  return mapProjectAgreementRow(updated);
}

export async function getProjectAgreementRecordForPdf(
  projectAgreementId: string,
  portalUserId: string
) {
  return prisma.projectAgreement.findFirst({
    where: { id: projectAgreementId, project: { portalUserId } },
    select: {
      id: true,
      title: true,
      body: true,
      documentVersion: true,
      signerName: true,
      signedAt: true,
      signedTimeZone: true,
      status: true,
    },
  });
}

export async function getProjectAgreementRecordForAdminPdf(
  projectAgreementId: string,
  consultationId: string
) {
  return prisma.projectAgreement.findFirst({
    where: {
      id: projectAgreementId,
      project: { consultationRequestId: consultationId },
    },
    select: {
      id: true,
      title: true,
      body: true,
      documentVersion: true,
      signerName: true,
      signedAt: true,
      signedTimeZone: true,
      status: true,
      project: { select: { portalUserId: true } },
    },
  });
}

export { PORTAL_AGREEMENT_VERSION };

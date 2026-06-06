import 'server-only';

import type {
  PortalConsultationRequestAgreement,
  PortalConsultationRequestDetail,
} from '@/lib/portal-consultation-requests-data';
import { prisma } from '@/lib/prisma';
import { normalizePortalEmail } from '@/lib/portal-user';
import { getClientServiceAgreementListItem } from '@/lib/client-agreement-store';
import type { ConsultationEmailDeliveryStatus } from '@/lib/consultation-email-delivery';

export type { PortalConsultationRequestDetail } from '@/lib/portal-consultation-requests-data';

type ConsultationRequestRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  preferredContact: string;
  timezone: string | null;
  message: string;
  emailDeliveryStatus: string | null;
  emailBouncedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const consultationRequestSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  company: true,
  preferredContact: true,
  timezone: true,
  message: true,
  emailDeliveryStatus: true,
  emailBouncedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

function mapEmailDeliveryStatus(
  value: string | null
): ConsultationEmailDeliveryStatus | null {
  if (value === 'delivered' || value === 'bounced') {
    return value;
  }

  return null;
}

function mapClientServiceAgreementSummary(
  item: Awaited<ReturnType<typeof getClientServiceAgreementListItem>>
): PortalConsultationRequestAgreement {
  return {
    id: item.id,
    title: item.title,
    body: item.body ?? null,
    signed: item.status.signed,
    signerName: item.status.signerName,
    signedAt: item.status.signedAt,
  };
}

function mapConsultationRequestRow(
  row: ConsultationRequestRow,
  project: { id: string; title: string } | null,
  clientServiceAgreement: PortalConsultationRequestAgreement,
  discussion: { body: string; updatedAt: Date } | null
): PortalConsultationRequestDetail {
  return {
    id: row.id,
    name: row.name.trim(),
    email: row.email.trim(),
    phone: row.phone?.trim() || null,
    company: row.company?.trim() || null,
    preferredContact: row.preferredContact === 'p' ? 'p' : 'e',
    timezone: row.timezone?.trim() || null,
    message: row.message.trim(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    projectId: project?.id ?? null,
    projectTitle: project?.title.trim() || null,
    emailDeliveryStatus: mapEmailDeliveryStatus(row.emailDeliveryStatus),
    emailBouncedAt: row.emailBouncedAt?.toISOString() ?? null,
    clientServiceAgreement,
    clientDiscussion: discussion
      ? {
          body: discussion.body,
          updatedAt: discussion.updatedAt.toISOString(),
        }
      : null,
  };
}

type LinkedProjectSummary = {
  id: string;
  title: string;
  createdAt: Date;
};

async function loadProjectByConsultationRequestId(
  consultationRequestIds: string[],
  portalUserId?: string
): Promise<Map<string, LinkedProjectSummary>> {
  if (consultationRequestIds.length === 0) {
    return new Map();
  }

  const projects = await prisma.project.findMany({
    where: {
      consultationRequestId: { in: consultationRequestIds },
      ...(portalUserId ? { portalUserId } : {}),
    },
    select: { id: true, title: true, consultationRequestId: true, createdAt: true },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  });

  const projectByRequestId = new Map<string, LinkedProjectSummary>();
  for (const project of projects) {
    if (!projectByRequestId.has(project.consultationRequestId)) {
      projectByRequestId.set(project.consultationRequestId, {
        id: project.id,
        title: project.title,
        createdAt: project.createdAt,
      });
    }
  }

  return projectByRequestId;
}

function sortConsultationRowsByProjectCreatedAt(
  rows: ConsultationRequestRow[],
  projectByRequestId: Map<string, LinkedProjectSummary>
): ConsultationRequestRow[] {
  return [...rows].sort((left, right) => {
    const leftProject = projectByRequestId.get(left.id);
    const rightProject = projectByRequestId.get(right.id);
    const leftTime = (leftProject?.createdAt ?? left.createdAt).getTime();
    const rightTime = (rightProject?.createdAt ?? right.createdAt).getTime();

    if (leftTime !== rightTime) {
      return leftTime - rightTime;
    }

    return left.id.localeCompare(right.id);
  });
}

async function attachClientServiceAgreementsForRows(
  rows: ConsultationRequestRow[]
): Promise<Map<string, PortalConsultationRequestAgreement>> {
  const clientServiceAgreements = await Promise.all(
    rows.map((row) => getClientServiceAgreementListItem(row.id))
  );

  const clientServiceAgreementByRequestId = new Map<string, PortalConsultationRequestAgreement>();
  rows.forEach((row, index) => {
    clientServiceAgreementByRequestId.set(
      row.id,
      mapClientServiceAgreementSummary(clientServiceAgreements[index]!)
    );
  });

  return clientServiceAgreementByRequestId;
}

async function loadDiscussionsByConsultationRequestId(
  consultationRequestIds: string[]
): Promise<Map<string, { body: string; updatedAt: Date }>> {
  if (consultationRequestIds.length === 0) {
    return new Map();
  }

  const rows = await prisma.consultationDiscussion.findMany({
    where: { consultationRequestId: { in: consultationRequestIds } },
    select: {
      consultationRequestId: true,
      body: true,
      updatedAt: true,
    },
  });

  return new Map(
    rows.map((row) => [
      row.consultationRequestId,
      { body: row.body, updatedAt: row.updatedAt },
    ] as const)
  );
}

function mapRowsWithProjects(
  rows: ConsultationRequestRow[],
  projectByRequestId: Map<string, LinkedProjectSummary>,
  clientServiceAgreementByRequestId: Map<string, PortalConsultationRequestAgreement>,
  discussionByRequestId: Map<string, { body: string; updatedAt: Date }>
): PortalConsultationRequestDetail[] {
  return rows.map((row) => {
    const project = projectByRequestId.get(row.id) ?? null;
    const clientServiceAgreement = clientServiceAgreementByRequestId.get(row.id)!;
    const discussion = discussionByRequestId.get(row.id) ?? null;
    return mapConsultationRequestRow(row, project, clientServiceAgreement, discussion);
  });
}

/** All consultation requests for a client email (oldest project first). */
export async function listConsultationRequestsForEmail(
  email: string
): Promise<PortalConsultationRequestDetail[]> {
  const rows = await prisma.consultationRequest.findMany({
    where: {
      email: {
        equals: normalizePortalEmail(email),
        mode: 'insensitive',
      },
    },
    select: consultationRequestSelect,
  });

  const projectByRequestId = await loadProjectByConsultationRequestId(rows.map((row) => row.id));
  const sortedRows = sortConsultationRowsByProjectCreatedAt(rows, projectByRequestId);
  const [clientServiceAgreementByRequestId, discussionByRequestId] = await Promise.all([
    attachClientServiceAgreementsForRows(sortedRows),
    loadDiscussionsByConsultationRequestId(sortedRows.map((row) => row.id)),
  ]);

  return mapRowsWithProjects(
    sortedRows,
    projectByRequestId,
    clientServiceAgreementByRequestId,
    discussionByRequestId
  );
}

export async function listConsultationRequestsForPortalUser(
  portalUserId: string
): Promise<PortalConsultationRequestDetail[]> {
  const rows = await prisma.consultationRequest.findMany({
    where: {
      OR: [{ portalUserId }, { projects: { some: { portalUserId } } }],
    },
    select: consultationRequestSelect,
  });

  const projectByRequestId = await loadProjectByConsultationRequestId(
    rows.map((row) => row.id),
    portalUserId
  );
  const sortedRows = sortConsultationRowsByProjectCreatedAt(rows, projectByRequestId);
  const [clientServiceAgreementByRequestId, discussionByRequestId] = await Promise.all([
    attachClientServiceAgreementsForRows(sortedRows),
    loadDiscussionsByConsultationRequestId(sortedRows.map((row) => row.id)),
  ]);

  return mapRowsWithProjects(
    sortedRows,
    projectByRequestId,
    clientServiceAgreementByRequestId,
    discussionByRequestId
  );
}

import 'server-only';

import type { ProjectStatus } from '@/generated/prisma/client';
import {
  getPortalAdminCompletedClientsPageHref,
  getPortalAdminCurrentClientsPageHref,
} from '@/lib/portal-admin-client-display';
import { PORTAL_ACTIVE_PROJECT_STATUSES } from '@/lib/portal-project-statuses';
import { prisma } from '@/lib/prisma';
import { PORTAL_MESSAGES_SECTION_ID, PORTAL_SUPPORT_PROGRESS_TITLE } from '@/lib/portal-support-constants';

export type PortalAdminUnreadMessageProject = {
  projectId: string;
  consultationRequestId: string;
  projectTitle: string;
  clientName: string;
  unviewedCount: number;
  href: string;
};

export function buildPortalAdminMessagesSectionHref(options: {
  consultationRequestId: string;
  projectId: string;
  projectStatus: ProjectStatus;
}): string {
  const hash = `#${PORTAL_MESSAGES_SECTION_ID}`;

  if (options.projectStatus === 'COMPLETED') {
    return `${getPortalAdminCompletedClientsPageHref(
      options.consultationRequestId,
      options.projectId
    )}${hash}`;
  }

  if ((PORTAL_ACTIVE_PROJECT_STATUSES as readonly ProjectStatus[]).includes(options.projectStatus)) {
    return `${getPortalAdminCurrentClientsPageHref(
      options.consultationRequestId,
      options.projectId
    )}${hash}`;
  }

  return `${getPortalAdminCompletedClientsPageHref(
    options.consultationRequestId,
    options.projectId
  )}${hash}`;
}

export async function getPortalAdminUnreadMessageProjects(): Promise<PortalAdminUnreadMessageProject[]> {
  const rows = await prisma.progressMessage.groupBy({
    by: ['progressId'],
    where: {
      kind: 'REQUEST',
      adminViewedAt: null,
      progress: {
        title: PORTAL_SUPPORT_PROGRESS_TITLE,
        project: {
          portalUser: { role: { not: 'a' } },
        },
      },
    },
    _count: { id: true },
    _max: { createdAt: true },
  });

  if (rows.length === 0) {
    return [];
  }

  const progressIds = rows.map((row) => row.progressId);

  const progressRows = await prisma.progress.findMany({
    where: { id: { in: progressIds } },
    select: {
      id: true,
      project: {
        select: {
          id: true,
          title: true,
          status: true,
          consultationRequestId: true,
          consultationRequest: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  const progressById = new Map(progressRows.map((row) => [row.id, row]));

  const projects: Array<PortalAdminUnreadMessageProject & { latestMessageAt: number }> = [];

  for (const row of rows) {
    const progress = progressById.get(row.progressId);
    if (!progress) {
      continue;
    }

    const { project } = progress;
    const clientName = project.consultationRequest.name.trim() || 'Client';
    const projectTitle = project.title.trim() || 'Project';

    projects.push({
      projectId: project.id,
      consultationRequestId: project.consultationRequestId,
      projectTitle,
      clientName,
      unviewedCount: row._count.id,
      href: buildPortalAdminMessagesSectionHref({
        consultationRequestId: project.consultationRequestId,
        projectId: project.id,
        projectStatus: project.status,
      }),
      latestMessageAt: row._max.createdAt?.getTime() ?? 0,
    });
  }

  projects.sort((a, b) => b.latestMessageAt - a.latestMessageAt);

  return projects.map(({ latestMessageAt: _latestMessageAt, ...project }) => project);
}

export async function markProgressMessagesViewedForProject(projectId: string): Promise<number> {
  const result = await prisma.progressMessage.updateMany({
    where: {
      kind: 'REQUEST',
      adminViewedAt: null,
      progress: {
        projectId,
        title: PORTAL_SUPPORT_PROGRESS_TITLE,
      },
    },
    data: {
      adminViewedAt: new Date(),
    },
  });

  return result.count;
}

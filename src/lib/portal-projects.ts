import 'server-only';

import { prisma } from '@/lib/prisma';
import {
  PORTAL_ACTIVE_PROJECT_STATUSES,
  PORTAL_SELECTABLE_PROJECT_STATUSES,
  type PortalActiveProjectStatus,
  type PortalSelectableProjectStatus,
} from '@/lib/portal-project-statuses';
import { portalProjectDashboardHref } from '@/lib/portal-role-data';

export { portalProjectDashboardHref };
export {
  PORTAL_ACTIVE_PROJECT_STATUSES,
  PORTAL_ACTIVE_PROJECT_STATUSES as CLIENT_PORTAL_ACTIVE_PROJECT_STATUSES,
} from '@/lib/portal-project-statuses';

export type PortalProjectOption = {
  id: string;
  title: string;
  status: string;
  consultationRequestId: string;
};

const PROJECT_LIST_SELECT = {
  id: true,
  title: true,
  status: true,
  consultationRequestId: true,
} as const;

type ProjectListRow = {
  id: string;
  title: string;
  status: string;
  consultationRequestId: string;
};

function mapProjectRow(row: ProjectListRow): PortalProjectOption {
  return {
    id: row.id,
    title: row.title.trim() || 'Project',
    status: row.status,
    consultationRequestId: row.consultationRequestId,
  };
}

async function listProjectsForUser(
  portalUserId: string,
  statuses: readonly PortalActiveProjectStatus[] | readonly PortalSelectableProjectStatus[]
): Promise<PortalProjectOption[]> {
  const rows = await prisma.project.findMany({
    where: {
      portalUserId,
      status: { in: [...statuses] },
    },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    select: PROJECT_LIST_SELECT,
  });

  return rows.map(mapProjectRow);
}

async function getProjectForUser(
  projectId: string,
  portalUserId: string,
  statuses: readonly PortalActiveProjectStatus[] | readonly PortalSelectableProjectStatus[]
): Promise<PortalProjectOption | null> {
  const row = await prisma.project.findFirst({
    where: {
      id: projectId,
      portalUserId,
      status: { in: [...statuses] },
    },
    select: PROJECT_LIST_SELECT,
  });

  return row ? mapProjectRow(row) : null;
}

export async function clientHasActivePortalProject(portalUserId: string): Promise<boolean> {
  const count = await prisma.project.count({
    where: {
      portalUserId,
      status: { in: [...PORTAL_ACTIVE_PROJECT_STATUSES] },
    },
  });

  return count > 0;
}

export async function listClientPortalProjects(
  portalUserId: string
): Promise<PortalProjectOption[]> {
  return listProjectsForUser(portalUserId, PORTAL_ACTIVE_PROJECT_STATUSES);
}

export async function getClientPortalProjectForUser(
  projectId: string,
  portalUserId: string
): Promise<PortalProjectOption | null> {
  return getProjectForUser(projectId, portalUserId, PORTAL_ACTIVE_PROJECT_STATUSES);
}

export async function listSelectablePortalProjects(
  portalUserId: string
): Promise<PortalProjectOption[]> {
  return listProjectsForUser(portalUserId, PORTAL_SELECTABLE_PROJECT_STATUSES);
}

export async function getSelectablePortalProjectForUser(
  projectId: string,
  portalUserId: string
): Promise<PortalProjectOption | null> {
  return getProjectForUser(projectId, portalUserId, PORTAL_SELECTABLE_PROJECT_STATUSES);
}

export type PortalProjectGateResult =
  | { kind: 'picker' }
  | { kind: 'redirect'; projectId: string }
  | { kind: 'ready'; project: PortalProjectOption }
  | { kind: 'landing' }
  | { kind: 'none' };

/** Admin portal: auto-select a single project via redirect when none is in the URL. */
export function resolvePortalProjectGate(
  projects: PortalProjectOption[],
  selectedProjectId: string | undefined | null
): PortalProjectGateResult {
  if (projects.length === 0) {
    return { kind: 'none' };
  }

  if (projects.length === 1) {
    const only = projects[0]!;
    if (!selectedProjectId || selectedProjectId !== only.id) {
      return { kind: 'redirect', projectId: only.id };
    }
    return { kind: 'ready', project: only };
  }

  if (!selectedProjectId) {
    return { kind: 'picker' };
  }

  const match = projects.find((project) => project.id === selectedProjectId);
  if (!match) {
    return { kind: 'picker' };
  }

  return { kind: 'ready', project: match };
}

/**
 * Client portal: never auto-redirect; project workspace loads only when `?project=` is set.
 */
export function resolvePortalClientProjectGate(
  projects: PortalProjectOption[],
  selectedProjectId: string | undefined | null
): PortalProjectGateResult {
  if (projects.length === 0) {
    return { kind: 'none' };
  }

  if (!selectedProjectId?.trim()) {
    return { kind: 'landing' };
  }

  const match = projects.find((project) => project.id === selectedProjectId);
  if (!match) {
    return { kind: 'landing' };
  }

  return { kind: 'ready', project: match };
}

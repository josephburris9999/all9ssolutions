import 'server-only';

import { prisma } from '@/lib/prisma';
import { portalProjectDashboardHref } from '@/lib/portal-role-data';

export { portalProjectDashboardHref };

export type PortalProjectOption = {
  id: string;
  title: string;
  status: string;
  consultationRequestId: string;
};

const SELECTABLE_PROJECT_STATUSES = ['PLANNED', 'ACTIVE', 'ON_HOLD', 'COMPLETED'] as const;

export async function listSelectablePortalProjects(
  portalUserId: string
): Promise<PortalProjectOption[]> {
  const rows = await prisma.project.findMany({
    where: {
      portalUserId,
      status: { in: [...SELECTABLE_PROJECT_STATUSES] },
    },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      title: true,
      status: true,
      consultationRequestId: true,
    },
  });

  return rows.map((row) => ({
    id: row.id,
    title: row.title.trim() || 'Project',
    status: row.status,
    consultationRequestId: row.consultationRequestId,
  }));
}

export async function getSelectablePortalProjectForUser(
  projectId: string,
  portalUserId: string
): Promise<PortalProjectOption | null> {
  const row = await prisma.project.findFirst({
    where: {
      id: projectId,
      portalUserId,
      status: { in: [...SELECTABLE_PROJECT_STATUSES] },
    },
    select: {
      id: true,
      title: true,
      status: true,
      consultationRequestId: true,
    },
  });

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    title: row.title.trim() || 'Project',
    status: row.status,
    consultationRequestId: row.consultationRequestId,
  };
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

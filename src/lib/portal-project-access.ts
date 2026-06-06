import 'server-only';

import { prisma } from '@/lib/prisma';
import { CLIENT_PORTAL_ACTIVE_PROJECT_STATUSES } from '@/lib/portal-projects';

export async function portalUserOwnsProject(
  portalUserId: string,
  projectId: string
): Promise<boolean> {
  const row = await prisma.project.findFirst({
    where: { id: projectId, portalUserId },
    select: { id: true },
  });

  return row != null;
}

export async function portalUserOwnsActiveProject(
  portalUserId: string,
  projectId: string
): Promise<boolean> {
  const row = await prisma.project.findFirst({
    where: {
      id: projectId,
      portalUserId,
      status: { in: [...CLIENT_PORTAL_ACTIVE_PROJECT_STATUSES] },
    },
    select: { id: true },
  });

  return row != null;
}

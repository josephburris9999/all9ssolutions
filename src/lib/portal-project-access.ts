import 'server-only';

import { prisma } from '@/lib/prisma';
import { getClientPortalProjectForUser } from '@/lib/portal-projects';

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
  return (await getClientPortalProjectForUser(projectId, portalUserId)) != null;
}

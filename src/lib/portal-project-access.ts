import 'server-only';

import { prisma } from '@/lib/prisma';

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

import { prisma } from '@/lib/prisma';
import type { ProjectStatus } from '@/generated/prisma/client';

export type CreatePortalProjectInput = {
  portalUserId: string;
  consultationRequestId: string;
  title: string;
  estimatedCompletionAt?: Date | null;
  depositAmount?: number;
  status?: ProjectStatus;
};

export async function createPortalProject(input: CreatePortalProjectInput) {
  const project = await prisma.project.create({
    data: {
      portalUserId: input.portalUserId,
      consultationRequestId: input.consultationRequestId,
      title: input.title.trim(),
      estimatedCompletionAt: input.estimatedCompletionAt ?? null,
      depositAmount: input.depositAmount ?? 0,
      status: input.status ?? 'ACTIVE',
    },
  });

  return project;
}

export async function listPortalProjects(portalUserId: string) {
  return prisma.project.findMany({
    where: { portalUserId },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    include: { consultationRequest: { select: { createdAt: true } } },
  });
}

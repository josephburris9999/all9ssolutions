import 'server-only';

import { prisma } from '@/lib/prisma';

export class CompleteProjectError extends Error {
  constructor(
    message: string,
    readonly code: 'NOT_FOUND' | 'ALREADY_COMPLETED'
  ) {
    super(message);
    this.name = 'CompleteProjectError';
  }
}

export async function completeProject(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, status: true, consultationRequestId: true },
  });

  if (!project) {
    throw new CompleteProjectError('Project not found', 'NOT_FOUND');
  }

  if (project.status === 'COMPLETED') {
    throw new CompleteProjectError('Project is already completed', 'ALREADY_COMPLETED');
  }

  await prisma.project.update({
    where: { id: projectId },
    data: { status: 'COMPLETED' },
  });

  return {
    consultationRequestId: project.consultationRequestId,
  };
}

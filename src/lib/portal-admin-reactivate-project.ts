import 'server-only';

import { prisma } from '@/lib/prisma';

export class ReactivateProjectError extends Error {
  constructor(
    message: string,
    readonly code: 'NOT_FOUND' | 'NOT_COMPLETED'
  ) {
    super(message);
    this.name = 'ReactivateProjectError';
  }
}

export async function reactivateProject(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, status: true, consultationRequestId: true },
  });

  if (!project) {
    throw new ReactivateProjectError('Project not found', 'NOT_FOUND');
  }

  if (project.status !== 'COMPLETED') {
    throw new ReactivateProjectError('Project is not completed', 'NOT_COMPLETED');
  }

  await prisma.project.update({
    where: { id: projectId },
    data: { status: 'ACTIVE' },
  });

  return {
    consultationRequestId: project.consultationRequestId,
  };
}

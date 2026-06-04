import 'server-only';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import {
  isEstimatedCompletionDateAllowedOnServer,
  parseEstimatedCompletionInputOnServer,
  PROJECT_ESTIMATED_COMPLETION_PAST_DATE_MESSAGE,
} from '@/lib/portal-project-estimated-completion';

export const updateProjectEstimatedCompletionSchema = z.object({
  estimatedCompletionDate: z
    .string()
    .trim()
    .min(1, 'Estimated completion date is required'),
});

export type UpdateProjectEstimatedCompletionInput = z.infer<
  typeof updateProjectEstimatedCompletionSchema
>;

export class UpdateProjectEstimatedCompletionError extends Error {
  constructor(
    message: string,
    readonly code: 'NOT_FOUND' | 'INVALID'
  ) {
    super(message);
    this.name = 'UpdateProjectEstimatedCompletionError';
  }
}

export async function updateProjectEstimatedCompletion(
  projectId: string,
  input: UpdateProjectEstimatedCompletionInput
) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true },
  });

  if (!project) {
    throw new UpdateProjectEstimatedCompletionError('Project not found', 'NOT_FOUND');
  }

  const trimmed = input.estimatedCompletionDate.trim();
  const parsed = parseEstimatedCompletionInputOnServer(trimmed);
  if (!parsed) {
    throw new UpdateProjectEstimatedCompletionError('Enter a valid completion date', 'INVALID');
  }

  if (!isEstimatedCompletionDateAllowedOnServer(trimmed)) {
    throw new UpdateProjectEstimatedCompletionError(
      PROJECT_ESTIMATED_COMPLETION_PAST_DATE_MESSAGE,
      'INVALID'
    );
  }

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: { estimatedCompletionAt: parsed },
    select: { estimatedCompletionAt: true },
  });

  return {
    estimatedCompletionAt: updated.estimatedCompletionAt?.toISOString() ?? null,
  };
}

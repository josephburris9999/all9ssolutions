import 'server-only';

import { z } from 'zod';
import { PORTAL_AGREEMENT_VERSION } from '@/lib/portal-agreement';
import {
  PROJECT_AGREEMENT_BODY_MAX_LENGTH,
} from '@/lib/portal-admin-add-project-agreement-schema';
import {
  isEstimatedCompletionDateAllowedOnServer,
  parseEstimatedCompletionInputOnServer,
  PROJECT_ESTIMATED_COMPLETION_PAST_DATE_MESSAGE,
  PROJECT_ESTIMATED_COMPLETION_REQUIRED_MESSAGE,
} from '@/lib/portal-project-estimated-completion';
import { prisma } from '@/lib/prisma';

export const addProjectAgreementSchema = z.object({
  agreementTitle: z
    .string()
    .trim()
    .min(1, 'Agreement title is required')
    .max(200),
  agreementBody: z
    .string()
    .trim()
    .min(1, 'Agreement body is required')
    .max(
      PROJECT_AGREEMENT_BODY_MAX_LENGTH,
      `Agreement body must be at most ${PROJECT_AGREEMENT_BODY_MAX_LENGTH} characters`
    ),
  estimatedCompletionDate: z
    .string()
    .trim()
    .min(1, PROJECT_ESTIMATED_COMPLETION_REQUIRED_MESSAGE),
  amount: z.coerce
    .number({ invalid_type_error: 'Enter a valid amount' })
    .min(0, 'Amount must be zero or greater')
    .max(999_999_999.99, 'Amount is too large'),
});

export type AddProjectAgreementInput = z.infer<typeof addProjectAgreementSchema>;

export class AddProjectAgreementError extends Error {
  constructor(
    message: string,
    readonly code: 'NOT_FOUND' | 'INVALID'
  ) {
    super(message);
    this.name = 'AddProjectAgreementError';
  }
}

export async function addProjectAgreement(projectId: string, input: AddProjectAgreementInput) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, consultationRequestId: true },
  });

  if (!project) {
    throw new AddProjectAgreementError('Project not found', 'NOT_FOUND');
  }

  const trimmedDate = input.estimatedCompletionDate.trim();
  const parsedDate = parseEstimatedCompletionInputOnServer(trimmedDate);
  if (!parsedDate) {
    throw new AddProjectAgreementError('Enter a valid completion date', 'INVALID');
  }

  if (!isEstimatedCompletionDateAllowedOnServer(trimmedDate)) {
    throw new AddProjectAgreementError(
      PROJECT_ESTIMATED_COMPLETION_PAST_DATE_MESSAGE,
      'INVALID'
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedProject = await tx.project.update({
      where: { id: projectId },
      data: { estimatedCompletionAt: parsedDate },
      select: { estimatedCompletionAt: true },
    });

    const agreementRow = await tx.projectAgreement.create({
      data: {
        projectId,
        title: input.agreementTitle.trim(),
        body: input.agreementBody.trim(),
        amount: input.amount,
        documentVersion: PORTAL_AGREEMENT_VERSION,
        status: 'PENDING',
      },
      select: {
        id: true,
        title: true,
        body: true,
        amount: true,
        projectId: true,
        project: { select: { title: true } },
      },
    });

    return { agreementRow, updatedProject };
  });

  return {
    agreement: {
      id: result.agreementRow.id,
      title: result.agreementRow.title,
      body: result.agreementRow.body,
      amount: result.agreementRow.amount,
      projectId: result.agreementRow.projectId,
      projectTitle: result.agreementRow.project.title,
    },
    estimatedCompletionAt: result.updatedProject.estimatedCompletionAt?.toISOString() ?? null,
    consultationRequestId: project.consultationRequestId,
  };
}

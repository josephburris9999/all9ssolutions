import 'server-only';

import { z } from 'zod';
import { createProjectForConsultationSchema } from '@/lib/portal-admin-create-project-schema';
import {
  isEstimatedCompletionDateAllowedOnServer,
  parseEstimatedCompletionInputOnServer,
  PROJECT_ESTIMATED_COMPLETION_PAST_DATE_MESSAGE,
} from '@/lib/portal-project-estimated-completion';
import { createProjectAmountDueItem } from '@/lib/portal-amount-due';
import { createPortalProject } from '@/lib/portal-project';
import {
  PortalUserProvisionError,
  provisionPortalUserForConsultation,
} from '@/lib/portal-provision-user';
import { prisma } from '@/lib/prisma';
import { isPortalAdminRole } from '@/lib/portal-role-data';

const createProjectForConsultationInputSchema = createProjectForConsultationSchema.extend({
  estimatedCompletionAt: z
    .string()
    .trim()
    .optional()
    .transform((value, ctx) => {
      if (!value || value.trim().length === 0) {
        return undefined;
      }
      const parsed = parseEstimatedCompletionInputOnServer(value);
      if (!parsed) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Enter a valid completion date',
        });
        return z.NEVER;
      }

      if (!isEstimatedCompletionDateAllowedOnServer(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: PROJECT_ESTIMATED_COMPLETION_PAST_DATE_MESSAGE,
        });
        return z.NEVER;
      }

      return parsed;
    }),
});

export { createProjectForConsultationSchema } from '@/lib/portal-admin-create-project-schema';
export { createProjectForConsultationInputSchema };
export type CreateProjectForConsultationInput = z.infer<typeof createProjectForConsultationInputSchema>;

export class CreateProjectForConsultationError extends Error {
  constructor(
    message: string,
    readonly code: 'NOT_FOUND' | 'ALREADY_HAS_PROJECT' | 'INVALID_STATE'
  ) {
    super(message);
    this.name = 'CreateProjectForConsultationError';
  }
}

function defaultProjectTitle(options: {
  name: string;
  company: string | null;
}): string {
  const company = options.company?.trim();
  if (company) {
    return company;
  }

  const name = options.name.trim();
  return name ? `${name} project` : 'Client project';
}

export async function createProjectForConsultation(
  consultationRequestId: string,
  input: CreateProjectForConsultationInput
) {
  const consultation = await prisma.consultationRequest.findUnique({
    where: { id: consultationRequestId },
    select: {
      id: true,
      name: true,
      email: true,
      company: true,
      portalUserId: true,
      portalUser: { select: { role: true } },
      projects: { select: { id: true }, take: 1 },
    },
  });

  if (!consultation) {
    throw new CreateProjectForConsultationError('Consultation request not found', 'NOT_FOUND');
  }

  if (consultation.projects.length > 0) {
    throw new CreateProjectForConsultationError(
      'This consultation request already has a project',
      'ALREADY_HAS_PROJECT'
    );
  }

  let portalUserId = consultation.portalUserId;
  let temporaryPassword: string | null = null;

  if (portalUserId && consultation.portalUser && isPortalAdminRole(consultation.portalUser.role)) {
    throw new CreateProjectForConsultationError(
      'Cannot create a project for an admin portal account',
      'INVALID_STATE'
    );
  }

  if (!portalUserId) {
    try {
      const provisioned = await provisionPortalUserForConsultation(consultationRequestId);
      portalUserId = provisioned.portalUserId;
      temporaryPassword = provisioned.temporaryPassword;
    } catch (error) {
      if (error instanceof PortalUserProvisionError) {
        throw new CreateProjectForConsultationError(error.message, 'INVALID_STATE');
      }
      throw error;
    }
  }

  const title = input.title.trim() || defaultProjectTitle(consultation);

  const project = await createPortalProject({
    portalUserId,
    consultationRequestId: consultation.id,
    title,
    estimatedCompletionAt: input.estimatedCompletionAt,
    depositAmount: input.depositAmount,
    design: input.design,
    status: 'ACTIVE',
  });

  if (input.amountDue != null && input.amountDue > 0) {
    await createProjectAmountDueItem({
      projectId: project.id,
      amount: input.amountDue,
      description: 'Amount due',
    });
  }

  return {
    project,
    portalUserId,
    temporaryPassword,
    clientEmail: consultation.email.trim(),
    clientName: consultation.name.trim(),
  };
}

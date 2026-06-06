import { CONSULTATION_NAME_MAX_LENGTH } from '@/lib/field-lengths';
import { z } from 'zod';
import {
  isEstimatedCompletionDateAllowed,
  parseEstimatedCompletionInput,
  PROJECT_ESTIMATED_COMPLETION_PAST_DATE_MESSAGE,
  PROJECT_ESTIMATED_COMPLETION_REQUIRED_MESSAGE,
} from '@/lib/portal-project-estimated-completion';

export const PROJECT_AGREEMENT_BODY_MAX_LENGTH = 20000;
const PROJECT_AGREEMENT_TITLE_MAX_LENGTH = CONSULTATION_NAME_MAX_LENGTH;

const requiredMoneyStringSchema = z
  .string()
  .trim()
  .min(1, 'Amount is required')
  .superRefine((value, ctx) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a valid amount' });
      return;
    }
    if (parsed < 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Amount must be zero or greater' });
      return;
    }
    if (parsed > 999_999_999.99) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Amount is too large' });
    }
  })
  .transform((value) => Number(value));

export const addProjectAgreementFormSchema = z.object({
  agreementTitle: z
    .string()
    .trim()
    .min(1, 'Agreement title is required')
    .max(PROJECT_AGREEMENT_TITLE_MAX_LENGTH),
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
    .min(1, PROJECT_ESTIMATED_COMPLETION_REQUIRED_MESSAGE)
    .superRefine((value, ctx) => {
      if (!parseEstimatedCompletionInput(value)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a valid completion date' });
        return;
      }

      if (!isEstimatedCompletionDateAllowed(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: PROJECT_ESTIMATED_COMPLETION_PAST_DATE_MESSAGE,
        });
      }
    }),
  amount: requiredMoneyStringSchema,
});

export type AddProjectAgreementFormValues = z.infer<typeof addProjectAgreementFormSchema>;

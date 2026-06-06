import {
  PROJECT_AGREEMENT_BODY_MAX_LENGTH,
  PROJECT_AGREEMENT_TITLE_MAX_LENGTH,
  PROJECT_TITLE_MAX_LENGTH,
} from '@/lib/field-lengths';
import { z } from 'zod';
import {
  isFutureEstimatedCompletionDateAllowed,
  isFutureEstimatedCompletionDateAllowedOnServer,
  parseEstimatedCompletionInput,
  parseEstimatedCompletionInputOnServer,
  PROJECT_ESTIMATED_COMPLETION_FUTURE_DATE_MESSAGE,
  PROJECT_ESTIMATED_COMPLETION_REQUIRED_MESSAGE,
} from '@/lib/portal-project-estimated-completion';

function requiredMoneyStringSchema(requiredMessage: string) {
  return z
    .string()
    .trim()
    .min(1, requiredMessage)
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
}

const requiredMoneyNumberSchema = z.coerce
  .number({ invalid_type_error: 'Enter a valid amount' })
  .min(0, 'Amount must be zero or greater')
  .max(999_999_999.99, 'Amount is too large');

const estimatedCompletionDateFormSchema = z
  .string()
  .trim()
  .min(1, PROJECT_ESTIMATED_COMPLETION_REQUIRED_MESSAGE)
  .superRefine((value, ctx) => {
    if (!parseEstimatedCompletionInput(value)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a valid completion date' });
      return;
    }

    if (!isFutureEstimatedCompletionDateAllowed(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: PROJECT_ESTIMATED_COMPLETION_FUTURE_DATE_MESSAGE,
      });
    }
  });

const estimatedCompletionDateServerSchema = z
  .string()
  .trim()
  .min(1, PROJECT_ESTIMATED_COMPLETION_REQUIRED_MESSAGE)
  .superRefine((value, ctx) => {
    if (!parseEstimatedCompletionInputOnServer(value)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a valid completion date' });
      return;
    }

    if (!isFutureEstimatedCompletionDateAllowedOnServer(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: PROJECT_ESTIMATED_COMPLETION_FUTURE_DATE_MESSAGE,
      });
    }
  });

const sharedCreateProjectFields = {
  title: z.string().trim().min(1, 'Title is required').max(PROJECT_TITLE_MAX_LENGTH),
  agreementTitle: z
    .string()
    .trim()
    .min(1, 'Agreement title is required')
    .max(PROJECT_AGREEMENT_TITLE_MAX_LENGTH),
  agreementBody: z
    .string()
    .trim()
    .min(1, 'Agreement is required')
    .max(
      PROJECT_AGREEMENT_BODY_MAX_LENGTH,
      `Agreement must be at most ${PROJECT_AGREEMENT_BODY_MAX_LENGTH} characters`
    ),
};

export const createProjectFormSchema = z.object({
  ...sharedCreateProjectFields,
  estimatedCompletionDate: estimatedCompletionDateFormSchema,
  depositAmount: requiredMoneyStringSchema('Deposit amount is required'),
  amountDue: requiredMoneyStringSchema('Amount due is required'),
});

export type CreateProjectFormValues = z.infer<typeof createProjectFormSchema>;

export const createProjectForConsultationSchema = z.object({
  ...sharedCreateProjectFields,
  estimatedCompletionDate: estimatedCompletionDateServerSchema,
  depositAmount: requiredMoneyNumberSchema,
  amountDue: requiredMoneyNumberSchema,
});

export type CreateProjectFieldName = keyof CreateProjectFormValues;

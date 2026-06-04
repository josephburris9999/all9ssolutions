import { z } from 'zod';
import {
  isEstimatedCompletionDateAllowed,
  parseEstimatedCompletionInput,
  PROJECT_ESTIMATED_COMPLETION_PAST_DATE_MESSAGE,
} from '@/lib/portal-project-estimated-completion';

export const PROJECT_DESIGN_MAX_LENGTH = 20000;

const optionalMoneyStringSchema = z
  .string()
  .trim()
  .superRefine((value, ctx) => {
    if (value.length === 0) {
      return;
    }
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
  .transform((value) => (value.length === 0 ? undefined : Number(value)));

export const createProjectFormSchema = z.object({
  title: z.string().trim().min(1, 'Project title is required').max(200),
  estimatedCompletionDate: z
    .string()
    .trim()
    .optional()
    .default('')
    .superRefine((value, ctx) => {
      if (!value || value.trim().length === 0) {
        return;
      }

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
  depositAmount: optionalMoneyStringSchema,
  amountDue: optionalMoneyStringSchema,
  design: z
    .string()
    .trim()
    .min(1, 'Project design is required')
    .max(PROJECT_DESIGN_MAX_LENGTH, `Project design must be at most ${PROJECT_DESIGN_MAX_LENGTH} characters`),
});

export type CreateProjectFormValues = z.infer<typeof createProjectFormSchema>;

export const moneyAmountSchema = z.coerce
  .number({ invalid_type_error: 'Enter a valid amount' })
  .min(0, 'Amount must be zero or greater')
  .max(999_999_999.99, 'Amount is too large');

export const createProjectForConsultationSchema = z.object({
  title: z.string().trim().min(1, 'Project title is required').max(200),
  estimatedCompletionAt: z.string().trim().optional(),
  depositAmount: moneyAmountSchema.optional(),
  amountDue: moneyAmountSchema.optional(),
  design: z
    .string()
    .trim()
    .min(1, 'Project design is required')
    .max(PROJECT_DESIGN_MAX_LENGTH, `Project design must be at most ${PROJECT_DESIGN_MAX_LENGTH} characters`),
});

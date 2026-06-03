import * as z from 'zod';
import {
  CONSULTATION_COMPANY_MAX_LENGTH,
  CONSULTATION_EMAIL_MAX_LENGTH,
  CONSULTATION_MESSAGE_MAX_LENGTH,
  CONSULTATION_NAME_MAX_LENGTH,
  CONSULTATION_PHONE_MAX_LENGTH,
  CONSULTATION_TIMEZONE_MAX_LENGTH,
} from '@/lib/field-lengths';

export { CONSULTATION_MESSAGE_MAX_LENGTH } from '@/lib/field-lengths';

function refineConsultationPhone(
  data: { phone: string; preferredContact: 'e' | 'p'; timezone: string },
  ctx: z.RefinementCtx
) {
  const phoneDigits = data.phone.replace(/\D/g, '');
  if (data.preferredContact === 'p' && phoneDigits.length !== 10) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        phoneDigits.length === 0
          ? 'Phone number is required when phone is your preferred contact method'
          : 'Enter a 10-digit phone number',
      path: ['phone'],
    });
  } else if (phoneDigits.length > 0 && phoneDigits.length !== 10) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Enter a 10-digit phone number',
      path: ['phone'],
    });
  }
  if (phoneDigits.length === 10 && data.timezone.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Timezone is required',
      path: ['timezone'],
    });
  }
}

const consultationFormBaseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Full name is required')
    .min(2, 'Please enter at least 2 characters for your name')
    .max(CONSULTATION_NAME_MAX_LENGTH),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Enter a valid email address')
    .max(CONSULTATION_EMAIL_MAX_LENGTH),
  phone: z.string().trim().max(CONSULTATION_PHONE_MAX_LENGTH),
  timezone: z.string().trim().max(CONSULTATION_TIMEZONE_MAX_LENGTH),
  preferredContact: z.enum(['e', 'p']),
  company: z.string().trim().max(CONSULTATION_COMPANY_MAX_LENGTH),
  message: z
    .string()
    .trim()
    .min(1, 'How can we help? is required')
    .min(10, 'Please provide a bit more detail (at least 10 characters)')
    .max(CONSULTATION_MESSAGE_MAX_LENGTH),
});

export const consultationFormSchema = consultationFormBaseSchema.superRefine(refineConsultationPhone);

export type ConsultationFormValues = z.infer<typeof consultationFormSchema>;

export const consultationSubmitSchema = consultationFormBaseSchema
  .extend({
    website: z.string().max(500),
    _formStartedAt: z.number().int().positive(),
    turnstileToken: z.string().optional(),
  })
  .superRefine(refineConsultationPhone);

export type ConsultationSubmitPayload = z.infer<typeof consultationSubmitSchema>;

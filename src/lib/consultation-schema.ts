import * as z from 'zod';

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
    .max(200),
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address').max(254),
  phone: z.string().trim().max(30),
  timezone: z.string().trim().max(100),
  preferredContact: z.enum(['e', 'p']),
  company: z.string().trim().max(200),
  message: z
    .string()
    .trim()
    .min(1, 'How can we help? is required')
    .min(10, 'Please provide a bit more detail (at least 10 characters)')
    .max(10000),
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

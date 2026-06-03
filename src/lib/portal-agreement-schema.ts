import { CONSULTATION_NAME_MAX_LENGTH, CONSULTATION_TIMEZONE_MAX_LENGTH } from '@/lib/field-lengths';
import { z } from 'zod';
import { isValidIanaTimeZone } from '@/lib/timezones';

const MAX_SIGN_CLOCK_SKEW_MS = 15 * 60 * 1000;

export const portalAgreementSignSchema = z
  .object({
    signerName: z
      .string()
      .trim()
      .min(2, 'Enter your full legal name')
      .max(CONSULTATION_NAME_MAX_LENGTH, 'Name is too long'),
    accepted: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the agreement to sign' }),
    }),
    /** Client browser time at sign-in (ISO 8601). */
    signedAt: z.string().datetime(),
    /** Client IANA timezone at sign-in (e.g. America/Chicago). */
    clientTimeZone: z.string().trim().max(CONSULTATION_TIMEZONE_MAX_LENGTH).optional(),
  })
  .superRefine((data, ctx) => {
    const signedAt = new Date(data.signedAt);
    if (Number.isNaN(signedAt.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid signature timestamp',
        path: ['signedAt'],
      });
      return;
    }

    if (Math.abs(signedAt.getTime() - Date.now()) > MAX_SIGN_CLOCK_SKEW_MS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Signature timestamp is out of range',
        path: ['signedAt'],
      });
    }

    if (data.clientTimeZone && !isValidIanaTimeZone(data.clientTimeZone)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid timezone',
        path: ['clientTimeZone'],
      });
    }
  });

export type PortalAgreementSignValues = z.infer<typeof portalAgreementSignSchema>;

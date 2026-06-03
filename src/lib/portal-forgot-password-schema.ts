import * as z from 'zod';
import { CONSULTATION_EMAIL_MAX_LENGTH } from '@/lib/field-lengths';

export const portalForgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Enter a valid email address')
    .max(CONSULTATION_EMAIL_MAX_LENGTH),
});

export type PortalForgotPasswordValues = z.infer<typeof portalForgotPasswordSchema>;

export const FORGOT_PASSWORD_SUCCESS_MESSAGE =
  'If a portal account exists for this email, we sent password reset instructions.';

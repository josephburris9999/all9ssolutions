import * as z from 'zod';
import { passwordPolicySchema, portalConfirmPasswordSchema } from '@/lib/password-policy';

export const portalResetPasswordSchema = z
  .object({
    token: z.string().trim().min(1, 'Reset link is invalid or expired'),
    newPassword: passwordPolicySchema,
    confirmPassword: portalConfirmPasswordSchema,
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type PortalResetPasswordValues = z.infer<typeof portalResetPasswordSchema>;

import * as z from 'zod';
import { passwordPolicySchema, portalConfirmPasswordSchema } from '@/lib/password-policy';

export const portalChangePasswordSchema = z
  .object({
    newPassword: passwordPolicySchema,
    confirmPassword: portalConfirmPasswordSchema,
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type PortalChangePasswordValues = z.infer<typeof portalChangePasswordSchema>;

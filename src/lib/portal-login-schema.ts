import * as z from 'zod';
import { CONSULTATION_EMAIL_MAX_LENGTH, PORTAL_PASSWORD_MAX_LENGTH } from '@/lib/field-lengths';

export const portalLoginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Enter a valid email address')
    .max(CONSULTATION_EMAIL_MAX_LENGTH),
  password: z.string().min(1, 'Password is required').max(PORTAL_PASSWORD_MAX_LENGTH),
});

export type PortalLoginValues = z.infer<typeof portalLoginSchema>;

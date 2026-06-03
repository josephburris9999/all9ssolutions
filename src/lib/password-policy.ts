import * as z from 'zod';
import { PORTAL_PASSWORD_MAX_LENGTH } from '@/lib/field-lengths';

const HAS_UPPERCASE = /[A-Z]/;
const HAS_NUMBER = /[0-9]/;
const HAS_SPECIAL = /[^A-Za-z0-9]/;

export { PORTAL_PASSWORD_MAX_LENGTH } from '@/lib/field-lengths';

export const portalConfirmPasswordSchema = z
  .string()
  .min(1, 'Please confirm your new password')
  .max(PORTAL_PASSWORD_MAX_LENGTH, `Password must be at most ${PORTAL_PASSWORD_MAX_LENGTH} characters`);

export const passwordPolicySchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(PORTAL_PASSWORD_MAX_LENGTH, `Password must be at most ${PORTAL_PASSWORD_MAX_LENGTH} characters`)
  .refine((value) => HAS_UPPERCASE.test(value), {
    message: 'Password must include at least one capital letter',
  })
  .refine((value) => HAS_NUMBER.test(value), {
    message: 'Password must include at least one number',
  })
  .refine((value) => HAS_SPECIAL.test(value), {
    message: 'Password must include at least one special character',
  });

export const PASSWORD_POLICY_HINT =
  'At least 8 characters with one capital letter, one number, and one special character';

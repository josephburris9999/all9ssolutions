import { CONSULTATION_NAME_MAX_LENGTH } from '@/lib/field-lengths';
import { z } from 'zod';

export const portalAdminNameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .min(2, 'Please enter at least 2 characters')
    .max(CONSULTATION_NAME_MAX_LENGTH),
});

export type PortalAdminNameValues = z.infer<typeof portalAdminNameSchema>;

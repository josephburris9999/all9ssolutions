import { CONSULTATION_COMPANY_MAX_LENGTH } from '@/lib/field-lengths';
import { z } from 'zod';

export const portalAdminCompanySchema = z.object({
  company: z.string().trim().max(CONSULTATION_COMPANY_MAX_LENGTH),
});

export type PortalAdminCompanyValues = z.infer<typeof portalAdminCompanySchema>;

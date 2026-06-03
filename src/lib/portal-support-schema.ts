import * as z from 'zod';

export const PORTAL_SUPPORT_MESSAGE_MAX_LENGTH = 10000;

export const portalSupportMessageSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, 'Message is required')
    .min(10, 'Please provide a bit more detail (at least 10 characters)')
    .max(PORTAL_SUPPORT_MESSAGE_MAX_LENGTH),
  projectId: z.string().trim().min(1).optional(),
});

export type PortalSupportMessageValues = z.infer<typeof portalSupportMessageSchema>;

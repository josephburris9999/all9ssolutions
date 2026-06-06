import { z } from 'zod';
import { CONSULTATION_DISCUSSION_MAX_LENGTH } from '@/lib/field-lengths';

export const portalAdminConsultationDiscussionSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, 'Client discussion is required')
    .max(
      CONSULTATION_DISCUSSION_MAX_LENGTH,
      `Client discussion must be at most ${CONSULTATION_DISCUSSION_MAX_LENGTH} characters`
    ),
});

export type PortalAdminConsultationDiscussionInput = z.infer<
  typeof portalAdminConsultationDiscussionSchema
>;

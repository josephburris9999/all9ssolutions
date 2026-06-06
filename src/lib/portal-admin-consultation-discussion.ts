import 'server-only';

import { portalAdminConsultationDiscussionSchema } from '@/lib/portal-admin-consultation-discussion-schema';
import { prisma } from '@/lib/prisma';

export class SaveConsultationDiscussionError extends Error {
  constructor(
    message: string,
    readonly code: 'NOT_FOUND' | 'LOCKED' | 'INVALID'
  ) {
    super(message);
    this.name = 'SaveConsultationDiscussionError';
  }
}

export async function saveConsultationDiscussion(
  consultationRequestId: string,
  input: unknown
) {
  const parsed = portalAdminConsultationDiscussionSchema.safeParse(input);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Invalid client discussion';
    throw new SaveConsultationDiscussionError(message, 'INVALID');
  }

  const consultation = await prisma.consultationRequest.findUnique({
    where: { id: consultationRequestId },
    select: {
      id: true,
      projects: { select: { id: true }, take: 1 },
    },
  });

  if (!consultation) {
    throw new SaveConsultationDiscussionError('Consultation not found', 'NOT_FOUND');
  }

  if (consultation.projects.length > 0) {
    throw new SaveConsultationDiscussionError(
      'Client discussion cannot be edited after a project is created',
      'LOCKED'
    );
  }

  const discussion = await prisma.consultationDiscussion.upsert({
    where: { consultationRequestId },
    create: {
      consultationRequestId,
      body: parsed.data.body,
    },
    update: {
      body: parsed.data.body,
    },
    select: {
      body: true,
      updatedAt: true,
    },
  });

  return {
    body: discussion.body,
    updatedAt: discussion.updatedAt.toISOString(),
  };
}

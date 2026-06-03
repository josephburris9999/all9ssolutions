import 'server-only';

import { prisma } from '@/lib/prisma';
import { normalizePortalEmail } from '@/lib/portal-user';

export const CONSULTATION_EMAIL_DELIVERY_STATUS = {
  DELIVERED: 'delivered',
  BOUNCED: 'bounced',
} as const;

export type ConsultationEmailDeliveryStatus =
  (typeof CONSULTATION_EMAIL_DELIVERY_STATUS)[keyof typeof CONSULTATION_EMAIL_DELIVERY_STATUS];

export async function saveConsultationConfirmationResendEmailId(
  consultationRequestId: string,
  resendEmailId: string
): Promise<void> {
  await prisma.consultationRequest.update({
    where: { id: consultationRequestId },
    data: { lastResendEmailId: resendEmailId },
  });
}

export async function markConsultationEmailDelivered(resendEmailId: string): Promise<boolean> {
  const consultation = await prisma.consultationRequest.findFirst({
    where: { lastResendEmailId: resendEmailId },
    select: { id: true, emailDeliveryStatus: true },
  });

  if (!consultation || consultation.emailDeliveryStatus === CONSULTATION_EMAIL_DELIVERY_STATUS.BOUNCED) {
    return false;
  }

  await prisma.consultationRequest.update({
    where: { id: consultation.id },
    data: { emailDeliveryStatus: CONSULTATION_EMAIL_DELIVERY_STATUS.DELIVERED },
  });

  return true;
}

export async function markConsultationEmailBounced(options: {
  resendEmailId: string;
  recipientEmail?: string | null;
  bouncedAt: Date;
}): Promise<boolean> {
  let consultation = await prisma.consultationRequest.findFirst({
    where: { lastResendEmailId: options.resendEmailId },
    select: { id: true },
  });

  if (!consultation && options.recipientEmail) {
    consultation = await prisma.consultationRequest.findFirst({
      where: {
        email: {
          equals: normalizePortalEmail(options.recipientEmail),
          mode: 'insensitive',
        },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
  }

  if (!consultation) {
    return false;
  }

  await prisma.consultationRequest.update({
    where: { id: consultation.id },
    data: {
      emailDeliveryStatus: CONSULTATION_EMAIL_DELIVERY_STATUS.BOUNCED,
      emailBouncedAt: options.bouncedAt,
    },
  });

  return true;
}

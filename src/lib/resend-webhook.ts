import {
  markConsultationEmailBounced,
  markConsultationEmailDelivered,
} from '@/lib/consultation-email-delivery';

export type ResendWebhookEvent = {
  type: string;
  created_at: string;
  data: {
    email_id: string;
    to: string[];
    bounce?: {
      message?: string;
      type?: string;
    };
  };
};

function isPermanentBounce(bounceType: string | undefined): boolean {
  if (!bounceType) {
    return false;
  }

  const normalized = bounceType.trim().toLowerCase();
  return normalized === 'permanent' || normalized === 'hard';
}

export async function handleResendWebhookEvent(event: ResendWebhookEvent): Promise<void> {
  const { email_id: resendEmailId, to, bounce } = event.data;
  const recipientEmail = to[0] ?? null;
  const eventTime = new Date(event.created_at);

  if (event.type === 'email.delivered') {
    await markConsultationEmailDelivered(resendEmailId);
    return;
  }

  if (event.type === 'email.bounced' && isPermanentBounce(bounce?.type)) {
    await markConsultationEmailBounced({
      resendEmailId,
      recipientEmail,
      bouncedAt: Number.isNaN(eventTime.getTime()) ? new Date() : eventTime,
    });
  }
}

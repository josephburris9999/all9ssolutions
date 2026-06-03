import { describe, expect, it, vi } from 'vitest';
import { handleResendWebhookEvent } from './resend-webhook';

vi.mock('@/lib/consultation-email-delivery', () => ({
  markConsultationEmailDelivered: vi.fn(),
  markConsultationEmailBounced: vi.fn(),
}));

import {
  markConsultationEmailBounced,
  markConsultationEmailDelivered,
} from '@/lib/consultation-email-delivery';

describe('handleResendWebhookEvent', () => {
  it('marks permanent bounces', async () => {
    await handleResendWebhookEvent({
      type: 'email.bounced',
      created_at: '2026-06-17T12:00:00.000Z',
      data: {
        email_id: 'email-123',
        to: ['client@example.com'],
        bounce: { type: 'Permanent', message: '550 User unknown' },
      },
    });

    expect(markConsultationEmailBounced).toHaveBeenCalledWith({
      resendEmailId: 'email-123',
      recipientEmail: 'client@example.com',
      bouncedAt: new Date('2026-06-17T12:00:00.000Z'),
    });
  });

  it('ignores transient bounces', async () => {
    vi.mocked(markConsultationEmailBounced).mockClear();

    await handleResendWebhookEvent({
      type: 'email.bounced',
      created_at: '2026-06-17T12:00:00.000Z',
      data: {
        email_id: 'email-123',
        to: ['client@example.com'],
        bounce: { type: 'Transient', message: '451 Try again later' },
      },
    });

    expect(markConsultationEmailBounced).not.toHaveBeenCalled();
  });

  it('marks delivered emails', async () => {
    await handleResendWebhookEvent({
      type: 'email.delivered',
      created_at: '2026-06-17T12:00:00.000Z',
      data: {
        email_id: 'email-123',
        to: ['client@example.com'],
      },
    });

    expect(markConsultationEmailDelivered).toHaveBeenCalledWith('email-123');
  });
});

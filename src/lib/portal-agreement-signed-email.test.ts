import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildClientAgreementSignedEmail,
  sendClientAgreementSignedEmail,
} from './portal-agreement-signed-email';

describe('buildClientAgreementSignedEmail', () => {
  it('uses the agreement title in the subject line', () => {
    const { subject } = buildClientAgreementSignedEmail({
      name: 'Jane Client',
      signerName: 'Jane Client',
      signedAtLabel: 'May 28, 2026, 3:00 PM',
      agreementTitle: 'Website redesign agreement',
    });

    expect(subject).toBe('Your signed Website redesign agreement — all9s Solutions');
  });

  it('states the agreement was saved and mentions the attachment', () => {
    const { subject, html, text } = buildClientAgreementSignedEmail({
      name: 'Jane Client',
      signerName: 'Jane Client',
      signedAtLabel: 'May 28, 2026, 3:00 PM',
    });

    expect(subject).toContain('all9s Solutions – Client Service Agreement');
    expect(html).toContain('Jane Client');
    expect(html).toContain('saved your electronic signature');
    expect(html).toContain('May 28, 2026, 3:00 PM');
    expect(html).toContain('attached to this email');
    expect(text).toContain('attached to this email for your records');
  });

  it('includes project creation notice when requested', () => {
    const { html, text } = buildClientAgreementSignedEmail({
      name: 'Jane Client',
      signerName: 'Jane Client',
      signedAtLabel: 'May 28, 2026, 3:00 PM',
      includeProjectCreationNotice: true,
    });

    expect(html).toContain('within one business day');
    expect(text).toContain('within one business day');
  });

  it('omits project creation notice by default', () => {
    const { html, text } = buildClientAgreementSignedEmail({
      name: 'Jane Client',
      signerName: 'Jane Client',
      signedAtLabel: 'May 28, 2026, 3:00 PM',
    });

    expect(html).not.toContain('within one business day');
    expect(text).not.toContain('within one business day');
  });
});

describe('sendClientAgreementSignedEmail', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('sends the agreement pdf as an attachment with content_type', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test');
    vi.stubEnv('CONSULTATION_CONFIRMATION_FROM', 'all9s Solutions <hello@all9ssolutions.com>');

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    vi.stubGlobal('fetch', fetchMock);

    const pdf = Buffer.from('%PDF-1.4\n%test');

    const result = await sendClientAgreementSignedEmail({
      to: 'client@example.com',
      name: 'Jane Client',
      signerName: 'Jane Client',
      signedAtLabel: 'May 28, 2026, 3:00 PM',
      agreementTitle: 'SOW Addendum',
      pdfFilename: 'all9s-sow-addendum.pdf',
      pdf,
    });

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledOnce();

    const request = fetchMock.mock.calls[0]?.[1] as { body: string };
    const payload = JSON.parse(request.body) as {
      subject: string;
      attachments: Array<{ filename: string; content: string; content_type: string }>;
    };

    expect(payload.subject).toBe('Your signed SOW Addendum — all9s Solutions');
    expect(payload.attachments).toEqual([
      {
        filename: 'all9s-sow-addendum.pdf',
        content: pdf.toString('base64'),
        content_type: 'application/pdf',
      },
    ]);
  });
});

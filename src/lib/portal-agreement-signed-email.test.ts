import { describe, expect, it } from 'vitest';
import { buildClientAgreementSignedEmail } from './portal-agreement-signed-email';

describe('buildClientAgreementSignedEmail', () => {
  it('states the agreement was saved and mentions the attachment', () => {
    const { subject, html, text } = buildClientAgreementSignedEmail({
      name: 'Jane Client',
      signerName: 'Jane Client',
      signedAtLabel: 'May 28, 2026, 3:00 PM',
    });

    expect(subject).toContain('Client Service Agreement');
    expect(html).toContain('Jane Client');
    expect(html).toContain('saved your electronic signature');
    expect(html).toContain('May 28, 2026, 3:00 PM');
    expect(html).toContain('attached to this email');
    expect(text).toContain('attached to this email for your records');
  });
});

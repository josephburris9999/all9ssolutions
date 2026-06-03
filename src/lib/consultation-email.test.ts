import { describe, expect, it } from 'vitest';
import { buildConsultationConfirmationEmail } from './consultation-email';

describe('buildConsultationConfirmationEmail', () => {
  it('includes submitter details in subject and body', () => {
    const { subject, html, text } = buildConsultationConfirmationEmail({
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '(555) 123-4567',
      timezone: 'America/New_York',
      preferredContact: 'e',
      company: 'Acme Corp',
      message: 'We need help modernizing our stack.',
    });

    expect(subject).toContain('consultation request');
    expect(html).toContain('Jane Doe');
    expect(html).toContain('Acme Corp');
    expect(html).toContain('modernizing our stack');
    expect(text).toContain('Jane Doe');
    expect(text).toContain('one business day');
  });
});

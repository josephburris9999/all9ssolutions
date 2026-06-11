import { describe, expect, it } from 'vitest';
import { buildPortalTemporaryCredentialsEmail } from './portal-reset-email';

describe('buildPortalTemporaryCredentialsEmail', () => {
  it('includes portal sign-in details and temporary password', () => {
    const { subject, html, text } = buildPortalTemporaryCredentialsEmail({
      name: 'Jane Doe',
      temporaryPassword: 'TempPass123!',
      portalUrl: 'https://all9ssolutions.com',
    });

    expect(subject).toContain('client portal');
    expect(html).toContain('Jane Doe');
    expect(html).toContain('TempPass123!');
    expect(html).toContain('https://all9ssolutions.com/portal');
    expect(html).toContain('choose your own password');
    expect(text).toContain('Temporary password: TempPass123!');
    expect(text).toContain('choose your own password');
  });

  it('uses new-account copy by default', () => {
    const { html, text } = buildPortalTemporaryCredentialsEmail({
      name: 'Jane Doe',
      temporaryPassword: 'TempPass123!',
      portalUrl: 'https://all9ssolutions.com',
    });

    expect(html).toContain('account is ready');
    expect(text).toContain('account is ready');
  });

  it('uses reset copy when variant is reset', () => {
    const { html, text } = buildPortalTemporaryCredentialsEmail({
      name: 'Jane Doe',
      temporaryPassword: 'TempPass123!',
      portalUrl: 'https://all9ssolutions.com',
      variant: 'reset',
    });

    expect(html).toContain('has been reset');
    expect(text).toContain('has been reset');
  });

  it('uses new-account copy when variant is new', () => {
    const { html, text } = buildPortalTemporaryCredentialsEmail({
      name: 'Jane Doe',
      temporaryPassword: 'TempPass123!',
      portalUrl: 'https://all9ssolutions.com',
      variant: 'new',
    });

    expect(html).toContain('account is ready');
    expect(text).toContain('account is ready');
  });
});

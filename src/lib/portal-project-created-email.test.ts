import { describe, expect, it } from 'vitest';
import { buildPortalProjectCreatedEmail } from './portal-project-created-email';

describe('buildPortalProjectCreatedEmail', () => {
  it('includes project details and credentials for new portal accounts', () => {
    const { subject, html, text } = buildPortalProjectCreatedEmail({
      name: 'Jane Doe',
      projectTitle: 'Acme Website',
      portalUrl: 'https://all9ssolutions.com',
      projectId: 'proj_123',
      temporaryPassword: 'TempPass123!',
    });

    expect(subject).toContain('Acme Website');
    expect(html).toContain('Jane Doe');
    expect(html).toContain('Acme Website');
    expect(html).toContain('TempPass123!');
    expect(html).toContain('project=proj_123');
    expect(text).toContain('Temporary password: TempPass123!');
  });

  it('omits credentials for existing portal accounts', () => {
    const { html, text } = buildPortalProjectCreatedEmail({
      name: 'Jane Doe',
      projectTitle: 'Acme Website',
      portalUrl: 'https://all9ssolutions.com',
      projectId: 'proj_123',
    });

    expect(html).toContain('existing client portal account');
    expect(html).not.toContain('Temporary password');
    expect(text).not.toContain('Temporary password');
    expect(html).toContain('project=proj_123');
  });
});

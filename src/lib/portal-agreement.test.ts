import { describe, expect, it } from 'vitest';
import {
  buildPortalAgreementStatus,
  formatAgreementDate,
  formatPortalSignedAt,
  getPortalAgreementSectionsForClient,
} from './portal-agreement';

describe('buildPortalAgreementStatus', () => {
  it('returns signed status from an agreement record', () => {
    const status = buildPortalAgreementStatus({
      signedAt: new Date('2026-05-25T20:00:00.000Z'),
      signerName: 'Jane Client',
      version: '2026-05-31',
    });

    expect(status.signed).toBe(true);
    expect(status.signerName).toBe('Jane Client');
    expect(status.signedAt).toBe('2026-05-25T20:00:00.000Z');
    expect(status.agreementVersion).toBe('2026-05-31');
  });

  it('returns unsigned status when no agreement exists', () => {
    const status = buildPortalAgreementStatus(null);

    expect(status.signed).toBe(false);
    expect(status.signerName).toBeNull();
    expect(status.signedAt).toBeNull();
  });
});

describe('formatPortalSignedAt', () => {
  it('formats UTC instant in a fixed US timezone', () => {
    const label = formatPortalSignedAt('2026-05-25T20:00:00.000Z', 'America/New_York');
    expect(label).toMatch(/May 25, 2026/);
    expect(label).toMatch(/4:00\s*PM/);
  });
});

describe('getPortalAgreementSectionsForClient', () => {
  it('uses the signed date in section 23 when the agreement is signed', () => {
    const sections = getPortalAgreementSectionsForClient({
      client: {
        name: 'Jane Client',
        email: 'jane@example.com',
        company: 'Acme Corp',
        phone: null,
      },
      timeZone: 'America/Chicago',
      signature: {
        signerName: 'Jane Client',
        signedAt: '2026-05-25T20:00:00.000Z',
        signedAtLabel: 'May 25, 2026, 3:00 PM',
      },
    });

    const acceptance = sections.find((section) => section.heading === '23. Acceptance and Signatures');
    const clientBody = acceptance?.subsections?.find((section) => section.title === 'Client')?.body;
    const companyBody = acceptance?.subsections?.find((section) => section.title === 'all9s Solutions')?.body;

    expect(clientBody).toContain('Signature: Jane Client');
    expect(clientBody).toContain('Date: 05/25/2026');
    expect(companyBody).toContain('Date: 05/25/2026');
  });
});

describe('formatAgreementDate', () => {
  it('formats a signed instant as MM/dd/yyyy in the given timezone', () => {
    expect(formatAgreementDate('2026-05-25T20:00:00.000Z', 'America/Chicago')).toBe('05/25/2026');
  });
});

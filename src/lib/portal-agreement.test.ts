import { describe, expect, it } from 'vitest';
import {
  buildPortalAgreementClientSignatureBody,
  buildPortalAgreementSignatureSection,
  buildPortalAgreementStatus,
  formatAgreementDate,
  formatPortalSignedAt,
  getPortalAgreementContentSections,
  getPortalAgreementSectionsForClient,
  PORTAL_AGREEMENT_SIGNATURE_SECTION_HEADING,
} from './portal-agreement';

const baseClientProfile = {
  name: 'Jane Client',
  email: 'jane@example.com',
  company: null as string | null,
  phone: null as string | null,
  timezone: null as string | null,
  preferredContact: null as 'e' | 'p' | null,
};

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
        ...baseClientProfile,
        company: 'Acme Corp',
      },
      timeZone: 'America/Chicago',
      signature: {
        signerName: 'Jane Client',
        signedAt: '2026-05-25T20:00:00.000Z',
        signedAtLabel: 'May 25, 2026, 3:00 PM',
      },
    });

    const acceptance = sections.find(
      (section) => section.heading === PORTAL_AGREEMENT_SIGNATURE_SECTION_HEADING
    );
    const clientBody = acceptance?.subsections?.find((section) => section.title === 'Client')?.body;
    const companyBody = acceptance?.subsections?.find((section) => section.title === 'all9s Solutions')?.body;

    expect(clientBody).toContain('Signature: Jane Client');
    expect(clientBody).toContain('Date: 05/25/2026');
    expect(companyBody).toContain('Date: 05/25/2026');
  });

  it('leaves the client date blank until the client accepts the agreement', () => {
    const sections = getPortalAgreementSectionsForClient({
      client: baseClientProfile,
      timeZone: 'America/Chicago',
    });

    const clientBody = sections
      .find((section) => section.heading === PORTAL_AGREEMENT_SIGNATURE_SECTION_HEADING)
      ?.subsections?.find((section) => section.title === 'Client')?.body;

    expect(clientBody).toContain('Date: —');
  });

  it('previews today in the client signature area when the client has accepted', () => {
    const sections = getPortalAgreementSectionsForClient({
      client: baseClientProfile,
      timeZone: 'UTC',
      clientAccepted: true,
    });

    const clientBody = sections
      .find((section) => section.heading === PORTAL_AGREEMENT_SIGNATURE_SECTION_HEADING)
      ?.subsections?.find((section) => section.title === 'Client')?.body;

    expect(clientBody).toMatch(/Date: \d{2}\/\d{2}\/\d{4}/);
  });
});

describe('buildPortalAgreementSignatureSection', () => {
  it('uses the default heading for project agreements', () => {
    const section = buildPortalAgreementSignatureSection({
      client: baseClientProfile,
      timeZone: 'UTC',
      clientAccepted: true,
    });

    expect(section.heading).toBe('Acceptance and Signatures');
  });

  it('omits unavailable consultation fields from the client signature block', () => {
    const body = buildPortalAgreementClientSignatureBody({
      client: {
        ...baseClientProfile,
        email: 'jane@example.com',
      },
      timeZone: 'UTC',
    });

    expect(body).toContain('Full Name: Jane Client');
    expect(body).toContain('Email: jane@example.com');
    expect(body).not.toContain('Company:');
    expect(body).not.toContain('Phone:');
  });

  it('includes company only when present on the consultation profile', () => {
    const withoutCompany = buildPortalAgreementClientSignatureBody({
      client: baseClientProfile,
      timeZone: 'UTC',
    });
    const withCompany = buildPortalAgreementClientSignatureBody({
      client: {
        ...baseClientProfile,
        company: 'Acme Corp',
      },
      timeZone: 'UTC',
    });

    expect(withoutCompany).not.toContain('Company:');
    expect(withCompany).toContain('Company: Acme Corp');
  });

  it('includes phone when available', () => {
    const body = buildPortalAgreementClientSignatureBody({
      client: {
        ...baseClientProfile,
        phone: '5551234567',
      },
      timeZone: 'UTC',
      clientAccepted: true,
    });

    expect(body).toContain('Phone: 5551234567');
  });
});

describe('getPortalAgreementContentSections', () => {
  it('excludes the signature section from CSA body content', () => {
    const sections = getPortalAgreementContentSections();

    expect(sections.some((section) => section.heading === PORTAL_AGREEMENT_SIGNATURE_SECTION_HEADING)).toBe(
      false
    );
    expect(sections.some((section) => section.heading === '22. Electronic Signatures')).toBe(true);
  });
});

describe('formatAgreementDate', () => {
  it('formats a signed instant as MM/dd/yyyy in the given timezone', () => {
    expect(formatAgreementDate('2026-05-25T20:00:00.000Z', 'America/Chicago')).toBe('05/25/2026');
  });
});

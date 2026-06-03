import type { PortalClientProfile } from '@/lib/portal-user';

/** Bump when contract text changes; unsigned users must re-sign. */
export const PORTAL_AGREEMENT_VERSION = '2026-05-31';

export const PORTAL_AGREEMENT_TITLE = 'all9s Solutions – Client Service Agreement';

export const PORTAL_AGREEMENT_COMPANY = {
  name: 'all9s Solutions',
  email: 'hello@all9ssolutions.com',
  website: 'all9ssolutions.com',
  representativeName: 'Joseph Burris',
  representativeTitle: 'Founder / Software & Web Consultant',
} as const;

export type PortalAgreementSubsection = {
  title: string;
  body: string;
};

export type PortalAgreementSection = {
  heading: string;
  body?: string;
  subsections?: PortalAgreementSubsection[];
};

export function getAgreementSectionPlainBody(section: PortalAgreementSection): string {
  if (section.subsections) {
    return section.subsections.map((sub) => `${sub.title}\n${sub.body}`).join('\n');
  }
  return section.body ?? '';
}

export type PortalAgreementSignatureDetails = {
  signerName: string;
  signedAt: string;
  signedAtLabel: string;
};

export type PortalAgreementRenderContext = {
  client: PortalClientProfile;
  signature?: PortalAgreementSignatureDetails;
  /** Used for section 23 Date (MM/dd/yyyy). Falls back to the runtime default timezone. */
  timeZone?: string;
};

/** Agreement date as MM/dd/yyyy in the given IANA timezone. */
export function formatAgreementDate(date: Date | string, timeZone?: string): string {
  const value = typeof date === 'string' ? new Date(date) : date;

  return new Intl.DateTimeFormat('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    ...(timeZone ? { timeZone } : {}),
  }).format(value);
}

/** Today's date as MM/dd/yyyy in the given IANA timezone. */
export function formatAgreementTodayDate(timeZone?: string): string {
  return formatAgreementDate(new Date(), timeZone);
}

function formatAgreementClientField(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : '—';
}

function buildAcceptanceAndSignaturesSection(context: PortalAgreementRenderContext): PortalAgreementSection {
  const { client, signature } = context;
  const fullName = signature?.signerName ?? client.name;
  const phone = client.phone?.trim();
  const company = client.company?.trim();
  const agreementDate = signature?.signedAt
    ? formatAgreementDate(signature.signedAt, context.timeZone)
    : formatAgreementTodayDate(context.timeZone);

  const clientBody = [
    `Full Name: ${fullName}`,
    ...(company ? [`Company: ${company}`] : []),
    `Email: ${client.email}`,
    ...(phone ? [`Phone: ${phone}`] : []),
    `Signature: ${fullName}`,
    `Date: ${agreementDate}`,
  ].join('\n');

  const companyBody = [
    `Representative Name: ${PORTAL_AGREEMENT_COMPANY.representativeName}`,
    `Title: ${PORTAL_AGREEMENT_COMPANY.representativeTitle}`,
    `Signature: ${PORTAL_AGREEMENT_COMPANY.representativeName}`,
    `Date: ${agreementDate}`,
  ].join('\n');

  return {
    heading: '23. Acceptance and Signatures',
    subsections: [
      { title: 'Client', body: clientBody },
      { title: PORTAL_AGREEMENT_COMPANY.name, body: companyBody },
    ],
  };
}

/** Agreement sections with client-specific values in section 23 (and PDF). */
export function getPortalAgreementSectionsForClient(
  context: PortalAgreementRenderContext
): PortalAgreementSection[] {
  return getPortalAgreementSections().map((section) =>
    section.heading === '23. Acceptance and Signatures'
      ? buildAcceptanceAndSignaturesSection(context)
      : section
  );
}

export function getPortalAgreementSections(): PortalAgreementSection[] {
  return [
    {
      heading: '1. Company Information',
      body: `Business Name: ${PORTAL_AGREEMENT_COMPANY.name}
Email: ${PORTAL_AGREEMENT_COMPANY.email}
Website: ${PORTAL_AGREEMENT_COMPANY.website}`,
    },
    {
      heading: '2. Scope of Services',
      body: `all9s Solutions provides technology-related services which may include, but are not limited to:
• Custom Software Development
• Web Development
• Technology Consulting
• Database Solutions
• Business Automation
• Digital Transformation Services
Specific project details shall be described in written proposals, invoices, statements of work, project plans, emails, or attached exhibits incorporated into this Agreement.`,
    },
    {
      heading: '3. Project Deliverables',
      body: `The Company agrees to provide the deliverables specifically outlined in the approved proposal or project documentation. Deliverables may include:
• Source code
• Website files
• Design assets
• Graphics
• Databases
• Documentation
• User accounts
• Hosting configuration
• Technical reports
• Consultation summaries
Any services or deliverables not specifically listed are considered outside the scope of work and may require additional fees.`,
    },
    {
      heading: '4. Client Responsibilities',
      body: `The Client agrees to:
• Provide accurate project requirements
• Respond to requests for information in a timely manner
• Supply required content, images, branding materials, credentials, and approvals
• Maintain backups of important business data unless backup services are explicitly included
• Review completed work and provide feedback promptly
• Ensure they possess rights to any content provided to the Company
Delays caused by missing information, delayed approvals, or lack of communication may extend project timelines.`,
    },
    {
      heading: '5. Payment Terms',
      subsections: [
        {
          title: '5.1 Fees',
          body: 'Client agrees to pay the fees described in approved estimates, invoices, proposals, or payment schedules.',
        },
        {
          title: '5.2 Deposits',
          body: 'Projects under $1,000 may require payment in full before work begins. Projects over $1,000 generally require a non-refundable deposit of 30%-50% before work begins.',
        },
        {
          title: '5.3 Recurring Services',
          body: 'Monthly or recurring services such as hosting, maintenance, subscriptions, monitoring, support, or cloud services shall be billed on a recurring basis.',
        },
        {
          title: '5.4 Late Payments',
          body: 'Invoices unpaid within fifteen (15) days may accrue late fees up to 5% per month. Services may be suspended. Project completion may be delayed. Hosted content may be removed after reasonable notice.',
        },
        {
          title: '5.5 Collection Costs',
          body: 'Client agrees to pay reasonable collection costs, attorney fees, and court costs incurred in collecting overdue balances where permitted by law.',
        },
      ],
    },
    {
      heading: '6. Revisions and Change Requests',
      body: `Reasonable revisions may be included as defined in the project proposal. Additional revisions, redesigns, expanded functionality, or changes outside the approved scope may require:
• Additional fees
• Timeline extensions
• A revised proposal or addendum
Requests made after approval of completed work may be treated as new work.`,
    },
    {
      heading: '7. Timelines and Scheduling',
      body: `Estimated completion dates are projections only and depend upon:
• Timely client communication
• Third-party services
• Hosting providers
• Technical limitations
• Scope changes
The Company shall not be liable for delays caused by third-party providers, internet outages, hosting failures, client delays, or force majeure events.`,
    },
    {
      heading: '8. Intellectual Property',
      subsections: [
        {
          title: '8.1 Client Ownership',
          body: 'Upon full payment, the Client shall own the final approved deliverables specifically created for the project unless otherwise stated in writing.',
        },
        {
          title: '8.2 Company Ownership',
          body: `The Company retains ownership of:
• Internal development tools
• Frameworks
• Reusable code
• Templates
• Libraries
• Proprietary systems
• Pre-existing intellectual property`,
        },
        {
          title: '8.3 Third-Party Assets',
          body: 'Client agrees to comply with all applicable third-party license agreements.',
        },
      ],
    },
    {
      heading: '9. Hosting, Domains, and Third-Party Services',
      body: 'Availability and uptime are controlled by third-party providers. Pricing may change based on provider rates, and third-party outages are outside Company control.',
    },
    {
      heading: '10. Confidentiality',
      body: 'Both parties agree to keep confidential any proprietary or sensitive information shared during the course of the project.',
    },
    {
      heading: '11. Data Security and Backups',
      body: 'No system can guarantee complete protection against cyber attacks, data loss, malware, unauthorized access, hardware failure, or service interruptions.',
    },
    {
      heading: '12. Warranty Disclaimer',
      body: 'Services are provided on an "as-is" and "as-available" basis. The Company does not guarantee uninterrupted service, specific revenue increases, search engine rankings, continuous compatibility, or immunity from cyber threats.',
    },
    {
      heading: '13. Limitation of Liability',
      body: 'all9s Solutions shall not be liable for indirect damages, lost profits, lost business opportunities, data loss, service interruptions, or consequential damages. Liability shall not exceed the amount paid for services.',
    },
    {
      heading: '14. Indemnification',
      body: 'Client agrees to defend, indemnify, and hold harmless all9s Solutions from claims arising from client-provided materials, copyright infringement, illegal use, or violations of law.',
    },
    {
      heading: '15. Termination',
      body: 'Either party may terminate this Agreement with written notice. Client shall pay for completed work and accrued charges. Deposits may remain non-refundable.',
    },
    {
      heading: '16. Non-Solicitation',
      body: 'Client agrees not to directly hire or solicit Company contractors or subcontractors involved in the project for twelve (12) months without written consent.',
    },
    {
      heading: '17. Independent Contractor Relationship',
      body: 'The Company is an independent contractor and not an employee, partner, or joint venture of the Client.',
    },
    {
      heading: '18. Force Majeure',
      body: 'Neither party shall be liable for delays caused by natural disasters, outages, labor disputes, cyber incidents, war, pandemics, or other events beyond reasonable control.',
    },
    {
      heading: '19. Governing Law',
      body: 'This Agreement shall be governed by the laws of the State of Missouri.',
    },
    {
      heading: '20. Dispute Resolution',
      body: 'The parties agree to attempt good-faith negotiation before filing legal action.',
    },
    {
      heading: '21. Entire Agreement',
      body: 'This Agreement constitutes the complete agreement between the parties and supersedes prior discussions or understandings.',
    },
    {
      heading: '22. Electronic Signatures',
      body: 'Electronic signatures and digital approvals shall be considered legally binding where permitted by law.',
    },
    buildAcceptanceAndSignaturesSection({
      client: { name: '—', email: '—', company: null, phone: null },
    }),
  ];
}

export type PortalAgreementStatus = {
  signed: boolean;
  signerName: string | null;
  signedAt: string | null;
  agreementVersion: string | null;
  currentVersion: string;
};

export function hasSignedPortalAgreement(
  agreement: { signedAt: Date; signerName: string } | null | undefined
): boolean {
  return agreement != null;
}

/** Format agreement signed time in the client's IANA timezone (e.g. America/Chicago). */
export function formatPortalSignedAt(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone,
  }).format(new Date(iso));
}

/** Browser IANA timezone; use when the client has no stored consultation timezone. */
export function getBrowserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

export function buildPortalAgreementStatus(
  agreement: { signedAt: Date; signerName: string; version: string } | null | undefined,
  documentVersion: string = PORTAL_AGREEMENT_VERSION
): PortalAgreementStatus {
  const signed = hasSignedPortalAgreement(agreement);

  return {
    signed,
    signerName: agreement?.signerName ?? null,
    signedAt: agreement?.signedAt?.toISOString() ?? null,
    agreementVersion: agreement?.version ?? null,
    currentVersion: documentVersion,
  };
}

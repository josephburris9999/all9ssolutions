import { describe, expect, it } from 'vitest';
import {
  areAllPortalAgreementsSigned,
  areAllProjectAgreementsSigned,
  buildClientServiceAgreementId,
  type PortalAgreementListItem,
} from '@/lib/portal-agreement-data';
import { PORTAL_AGREEMENT_TITLE, PORTAL_AGREEMENT_VERSION } from '@/lib/portal-agreement';

function clientItem(consultationRequestId: string, signed: boolean): PortalAgreementListItem {
  return {
    id: buildClientServiceAgreementId(consultationRequestId),
    kind: 'client',
    title: PORTAL_AGREEMENT_TITLE,
    consultationRequestId,
    projectId: null,
    projectTitle: null,
    status: {
      signed,
      signerName: signed ? 'Jane' : null,
      signedAt: signed ? '2026-01-01T00:00:00.000Z' : null,
      agreementVersion: PORTAL_AGREEMENT_VERSION,
      currentVersion: PORTAL_AGREEMENT_VERSION,
    },
  };
}

function projectItem(signed: boolean): PortalAgreementListItem {
  return {
    id: 'test',
    kind: 'project',
    title: 'Project SOW',
    body: 'Scope of work text',
    consultationRequestId: null,
    projectId: 'p1',
    projectTitle: 'Project',
    status: {
      signed,
      signerName: signed ? 'Jane' : null,
      signedAt: signed ? '2026-01-01T00:00:00.000Z' : null,
      agreementVersion: PORTAL_AGREEMENT_VERSION,
      currentVersion: PORTAL_AGREEMENT_VERSION,
    },
  };
}

describe('areAllPortalAgreementsSigned', () => {
  it('returns false when there are no agreements', () => {
    expect(areAllPortalAgreementsSigned([])).toBe(false);
  });

  it('returns false when the Client Service Agreement is unsigned', () => {
    expect(areAllPortalAgreementsSigned([clientItem('cr1', false), projectItem(true)])).toBe(false);
  });

  it('returns false when any project agreement is unsigned', () => {
    expect(areAllPortalAgreementsSigned([clientItem('cr1', true), projectItem(false)])).toBe(false);
  });

  it('returns true when the Client Service Agreement is signed and there are no project agreements', () => {
    expect(areAllPortalAgreementsSigned([clientItem('cr1', true)])).toBe(true);
  });

  it('returns true when every listed agreement is signed', () => {
    expect(areAllPortalAgreementsSigned([clientItem('cr1', true), projectItem(true)])).toBe(true);
  });

  it('requires every listed consultation CSA to be signed', () => {
    expect(
      areAllPortalAgreementsSigned([clientItem('cr1', true), clientItem('cr2', false), projectItem(true)])
    ).toBe(false);
  });
});

describe('areAllProjectAgreementsSigned', () => {
  it('returns true when there are no project agreements', () => {
    expect(areAllProjectAgreementsSigned([clientItem('cr1', true)])).toBe(true);
  });

  it('returns false when a project agreement is unsigned', () => {
    expect(areAllProjectAgreementsSigned([clientItem('cr1', true), projectItem(false)])).toBe(false);
  });
});

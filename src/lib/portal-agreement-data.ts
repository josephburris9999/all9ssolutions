import type { PortalAgreementStatus } from '@/lib/portal-agreement';

const CLIENT_SERVICE_AGREEMENT_PREFIX = 'csa:';

/** Synthetic list id for a consultation's Client Service Agreement. */
export function buildClientServiceAgreementId(consultationRequestId: string): string {
  return `${CLIENT_SERVICE_AGREEMENT_PREFIX}${consultationRequestId}`;
}

export function parseClientServiceAgreementId(agreementId: string): string | null {
  if (!agreementId.startsWith(CLIENT_SERVICE_AGREEMENT_PREFIX)) {
    return null;
  }

  const consultationRequestId = agreementId.slice(CLIENT_SERVICE_AGREEMENT_PREFIX.length).trim();
  return consultationRequestId.length > 0 ? consultationRequestId : null;
}

/** @deprecated Use buildClientServiceAgreementId(consultationRequestId) */
export const CLIENT_SERVICE_AGREEMENT_ID = 'client-service-agreement';

/** @deprecated Use buildClientServiceAgreementId(consultationRequestId) */
export const LEGACY_CLIENT_AGREEMENT_ID = CLIENT_SERVICE_AGREEMENT_ID;

export type PortalAgreementListItem = {
  id: string;
  kind: 'client' | 'project';
  title: string;
  /** Custom agreement text; only set for project agreements. */
  body?: string | null;
  consultationRequestId: string | null;
  projectId: string | null;
  projectTitle: string | null;
  status: PortalAgreementStatus;
};

export function isClientServiceAgreement(item: PortalAgreementListItem): boolean {
  return item.kind === 'client';
}

export function isClientServiceAgreementSigned(agreements: PortalAgreementListItem[]): boolean {
  const clientAgreements = agreements.filter(isClientServiceAgreement);
  if (clientAgreements.length === 0) {
    return false;
  }
  return clientAgreements.every((item) => item.status.signed);
}

export function areAllProjectAgreementsSigned(agreements: PortalAgreementListItem[]): boolean {
  const projectAgreements = agreements.filter((item) => item.kind === 'project');
  if (projectAgreements.length === 0) {
    return true;
  }
  return projectAgreements.every((item) => item.status.signed);
}

/** Portal features unlock when every listed CSA and project agreement is signed. */
export function areAllPortalAgreementsSigned(agreements: PortalAgreementListItem[]): boolean {
  if (agreements.length === 0) {
    return false;
  }
  return isClientServiceAgreementSigned(agreements) && areAllProjectAgreementsSigned(agreements);
}

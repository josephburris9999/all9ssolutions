import {
  CLIENT_SERVICE_AGREEMENT_ID,
  LEGACY_CLIENT_AGREEMENT_ID,
  parseClientServiceAgreementId,
} from '@/lib/portal-agreement-data';

export { CLIENT_SERVICE_AGREEMENT_ID, LEGACY_CLIENT_AGREEMENT_ID };

export function getPortalAgreementSignPath(agreementId: string): string {
  const consultationRequestId = parseClientServiceAgreementId(agreementId);
  if (consultationRequestId) {
    return `/api/portal/consultation-requests/${encodeURIComponent(consultationRequestId)}/agreement`;
  }
  return `/api/portal/project-agreements/${encodeURIComponent(agreementId)}/sign`;
}

export function getPortalAgreementPdfPath(
  agreementId: string,
  consultationRequestId?: string | null
): string {
  const parsedConsultationId = parseClientServiceAgreementId(agreementId);
  if (parsedConsultationId) {
    if (consultationRequestId) {
      return `/api/portal/admin/consultations/${encodeURIComponent(consultationRequestId)}/agreement/pdf`;
    }
    return `/api/portal/consultation-requests/${encodeURIComponent(parsedConsultationId)}/agreement/pdf`;
  }

  if (consultationRequestId) {
    return `/api/portal/admin/consultations/${encodeURIComponent(consultationRequestId)}/project-agreements/${encodeURIComponent(agreementId)}/pdf`;
  }

  return `/api/portal/project-agreements/${encodeURIComponent(agreementId)}/pdf`;
}

import { describe, expect, it } from 'vitest';
import { buildClientServiceAgreementId } from '@/lib/portal-agreement-data';
import { getPortalAgreementPdfPath, getPortalAgreementSignPath } from '@/lib/portal-agreement-paths';

describe('portal agreement paths', () => {
  it('uses consultation-scoped sign path for client service agreements', () => {
    const consultationRequestId = 'consult_1';
    expect(getPortalAgreementSignPath(buildClientServiceAgreementId(consultationRequestId))).toBe(
      '/api/portal/consultation-requests/consult_1/agreement'
    );
  });

  it('uses project sign path', () => {
    expect(getPortalAgreementSignPath('proj_agreement_1')).toBe(
      '/api/portal/project-agreements/proj_agreement_1/sign'
    );
  });

  it('uses consultation-scoped client pdf path', () => {
    const consultationRequestId = 'consult_1';
    expect(getPortalAgreementPdfPath(buildClientServiceAgreementId(consultationRequestId))).toBe(
      '/api/portal/consultation-requests/consult_1/agreement/pdf'
    );
  });

  it('uses admin client pdf path', () => {
    expect(getPortalAgreementPdfPath(buildClientServiceAgreementId('consult_1'), 'consult_1')).toBe(
      '/api/portal/admin/consultations/consult_1/agreement/pdf'
    );
  });

  it('uses admin project pdf path', () => {
    expect(getPortalAgreementPdfPath('proj_agreement_1', 'consult_1')).toBe(
      '/api/portal/admin/consultations/consult_1/project-agreements/proj_agreement_1/pdf'
    );
  });
});

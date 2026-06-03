import { describe, expect, it } from 'vitest';
import { PORTAL_AGREEMENT_TITLE } from '@/lib/portal-agreement';
import {
  agreementPdfDownloadFilename,
  PORTAL_CLIENT_SERVICE_AGREEMENT_PDF_FILENAME,
} from '@/lib/portal-agreement-filename';

describe('agreementPdfDownloadFilename', () => {
  it('uses the standard client service agreement filename without duplicating all9s', () => {
    expect(agreementPdfDownloadFilename(PORTAL_AGREEMENT_TITLE)).toBe(
      PORTAL_CLIENT_SERVICE_AGREEMENT_PDF_FILENAME
    );
    expect(agreementPdfDownloadFilename(PORTAL_AGREEMENT_TITLE)).toBe(
      'all9s-solutions-client-service-agreement.pdf'
    );
  });

  it('prefixes custom agreement titles that do not already start with all9s', () => {
    expect(agreementPdfDownloadFilename('Website redesign agreement')).toBe(
      'all9s-website-redesign-agreement.pdf'
    );
  });
});

import { PORTAL_AGREEMENT_TITLE } from '@/lib/portal-agreement';

export const PORTAL_CLIENT_SERVICE_AGREEMENT_PDF_FILENAME =
  'all9s-solutions-client-service-agreement.pdf';

/** @deprecated Use PORTAL_CLIENT_SERVICE_AGREEMENT_PDF_FILENAME */
export const CLIENT_AGREEMENT_PDF_FILENAME = PORTAL_CLIENT_SERVICE_AGREEMENT_PDF_FILENAME;

export function agreementPdfDownloadFilename(title: string): string {
  if (title.trim() === PORTAL_AGREEMENT_TITLE) {
    return PORTAL_CLIENT_SERVICE_AGREEMENT_PDF_FILENAME;
  }

  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

  const base = slug.startsWith('all9s-') ? slug : `all9s-${slug || 'agreement'}`;
  return `${base}.pdf`;
}

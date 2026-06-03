import { describe, expect, it } from 'vitest';
import { PORTAL_UPLOAD_FILE_NAME_MAX_LENGTH } from '@/lib/field-lengths';
import {
  formatPortalUploadSize,
  getPortalContentUploadDownloadPath,
  getPortalUploadExtension,
  isPortalUploadExtensionAllowed,
  resolvePortalUploadMimeType,
  sanitizePortalUploadFileName,
} from './portal-content-upload-constants';

describe('portal-content-upload-constants', () => {
  it('sanitizes unsafe file names', () => {
    expect(sanitizePortalUploadFileName('../../etc/passwd')).toBe('....etcpasswd');
    expect(sanitizePortalUploadFileName('  report.pdf  ')).toBe('report.pdf');
  });

  it('truncates file names to the database column limit', () => {
    const longName = `${'a'.repeat(PORTAL_UPLOAD_FILE_NAME_MAX_LENGTH + 50)}.pdf`;
    expect(sanitizePortalUploadFileName(longName)).toHaveLength(PORTAL_UPLOAD_FILE_NAME_MAX_LENGTH);
  });

  it('allows common client file extensions', () => {
    expect(isPortalUploadExtensionAllowed('brief.pdf')).toBe(true);
    expect(isPortalUploadExtensionAllowed('logo.png')).toBe(true);
    expect(isPortalUploadExtensionAllowed('script.exe')).toBe(false);
  });

  it('resolves mime type from extension', () => {
    expect(resolvePortalUploadMimeType('brief.pdf', 'application/octet-stream')).toBe('application/pdf');
    expect(resolvePortalUploadMimeType('script.exe', 'application/octet-stream')).toBeNull();
  });

  it('formats upload sizes', () => {
    expect(formatPortalUploadSize(512)).toBe('512 B');
    expect(getPortalUploadExtension('file.PDF')).toBe('.pdf');
  });

  it('builds client and admin download paths', () => {
    expect(getPortalContentUploadDownloadPath('up1')).toBe('/api/portal/content-uploads/up1/download');
    expect(getPortalContentUploadDownloadPath('up1', 'cr1')).toBe(
      '/api/portal/admin/consultations/cr1/content-uploads/up1/download'
    );
  });
});

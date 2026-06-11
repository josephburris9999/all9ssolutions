import { PORTAL_UPLOAD_FILE_NAME_MAX_LENGTH } from '@/lib/field-lengths';

export { PORTAL_UPLOAD_FILE_NAME_MAX_LENGTH } from '@/lib/field-lengths';

export const PORTAL_UPLOAD_MAX_BYTES = 25 * 1024 * 1024;
export const PORTAL_UPLOAD_MAX_FILES_PER_REQUEST = 10;

const ALLOWED_EXTENSIONS = new Set([
  '.pdf',
  '.doc',
  '.docx',
  '.txt',
  '.text',
  '.md',
  '.rtf',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.svg',
  '.zip',
]);

const EXTENSION_MIME: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.txt': 'text/plain',
  '.text': 'text/plain',
  '.md': 'text/markdown',
  '.rtf': 'application/rtf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.zip': 'application/zip',
};

export function formatPortalUploadSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getPortalUploadExtension(fileName: string): string {
  const index = fileName.lastIndexOf('.');
  if (index === -1) return '';
  return fileName.slice(index).toLowerCase();
}

export function isPortalUploadExtensionAllowed(fileName: string): boolean {
  return ALLOWED_EXTENSIONS.has(getPortalUploadExtension(fileName));
}

export function resolvePortalUploadMimeType(fileName: string, reportedType: string): string | null {
  const extension = getPortalUploadExtension(fileName);
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return null;
  }
  const expected = EXTENSION_MIME[extension];
  if (!expected) {
    return null;
  }

  const normalized = reportedType.split(';')[0]?.trim().toLowerCase() ?? '';
  if (!normalized || normalized === 'application/octet-stream' || normalized === expected) {
    return expected;
  }

  // Browser/OS MIME reporting is unreliable (especially on Windows). When the
  // extension is allowed, store the canonical type for that extension.
  if (extension === '.jpg' && normalized === 'image/jpg') {
    return 'image/jpeg';
  }

  return expected;
}

export function sanitizePortalUploadFileName(fileName: string): string {
  const base = fileName.replace(/[/\\\0]/g, '').trim();
  if (!base) {
    return 'upload';
  }
  if (base.length <= PORTAL_UPLOAD_FILE_NAME_MAX_LENGTH) {
    return base;
  }

  const extension = getPortalUploadExtension(base);
  if (extension && ALLOWED_EXTENSIONS.has(extension)) {
    const stem = base.slice(0, base.length - extension.length);
    const maxStemLength = PORTAL_UPLOAD_FILE_NAME_MAX_LENGTH - extension.length;
    return `${stem.slice(0, Math.max(1, maxStemLength))}${extension}`;
  }

  return base.slice(0, PORTAL_UPLOAD_FILE_NAME_MAX_LENGTH);
}

/** Client-safe download path (client portal vs admin viewing a client). */
export function getPortalContentUploadDownloadPath(
  uploadId: string,
  consultationRequestId?: string | null
): string {
  if (consultationRequestId) {
    return `/api/portal/admin/consultations/${encodeURIComponent(consultationRequestId)}/content-uploads/${encodeURIComponent(uploadId)}/download`;
  }
  return `/api/portal/content-uploads/${encodeURIComponent(uploadId)}/download`;
}

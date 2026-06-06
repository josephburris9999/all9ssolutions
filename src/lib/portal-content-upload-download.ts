import 'server-only';

import {
  getPortalContentUploadById,
  portalContentUploadDownloadHeaders,
  PortalContentUploadError,
  readPortalContentUploadBytes,
} from '@/lib/portal-content-upload';
import { portalUserOwnsActiveProject } from '@/lib/portal-project-access';

export async function loadPortalContentUploadForDownload(options: {
  uploadId: string;
  portalUserId: string;
}): Promise<{ buffer: Buffer; fileName: string; mimeType: string }> {
  const record = await getPortalContentUploadById(options.uploadId);

  if (!record || record.projectPortalUserId !== options.portalUserId) {
    throw new PortalContentUploadError('Upload not found');
  }

  if (
    record.projectId &&
    !(await portalUserOwnsActiveProject(options.portalUserId, record.projectId))
  ) {
    throw new PortalContentUploadError('Upload not found');
  }

  const buffer = await readPortalContentUploadBytes(record.storageKey);

  return {
    buffer,
    fileName: record.fileName,
    mimeType: record.mimeType,
  };
}

export function portalContentUploadDownloadResponse(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Response {
  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: portalContentUploadDownloadHeaders(fileName, mimeType),
  });
}

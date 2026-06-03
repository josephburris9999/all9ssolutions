import 'server-only';

import { randomUUID } from 'crypto';
import type { PortalContentUploadItem } from '@/lib/portal-content-upload-data';
import {
  formatPortalUploadSize,
  isPortalUploadExtensionAllowed,
  PORTAL_UPLOAD_MAX_BYTES,
  resolvePortalUploadMimeType,
  sanitizePortalUploadFileName,
} from '@/lib/portal-content-upload-constants';
import { prisma } from '@/lib/prisma';
import {
  createSupabaseServerClient,
  getPortalUploadBucketName,
  isSupabaseStorageConfigured,
} from '@/lib/supabase-server';

export {
  formatPortalUploadSize,
  PORTAL_UPLOAD_MAX_BYTES,
  PORTAL_UPLOAD_MAX_FILES_PER_REQUEST,
} from '@/lib/portal-content-upload-constants';

export class PortalContentUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PortalContentUploadError';
  }
}

function mapUploadRow(row: {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date;
}): PortalContentUploadItem {
  return {
    id: row.id,
    fileName: row.fileName,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    createdAt: row.createdAt.toISOString(),
  };
}

export type PortalContentUploadFileRecord = {
  id: string;
  projectId: string;
  projectPortalUserId: string;
  fileName: string;
  mimeType: string;
  storageKey: string;
};

export async function getPortalContentUploadById(
  uploadId: string
): Promise<PortalContentUploadFileRecord | null> {
  return prisma.portalContentUpload.findUnique({
    where: { id: uploadId },
    select: {
      id: true,
      projectId: true,
      project: { select: { portalUserId: true } },
      fileName: true,
      mimeType: true,
      storageKey: true,
    },
  }).then((row) =>
    row
      ? {
          id: row.id,
          projectId: row.projectId,
          projectPortalUserId: row.project.portalUserId,
          fileName: row.fileName,
          mimeType: row.mimeType,
          storageKey: row.storageKey,
        }
      : null
  );
}

export async function readPortalContentUploadBytes(storageKey: string): Promise<Buffer> {
  if (!isSupabaseStorageConfigured()) {
    throw new PortalContentUploadError('File storage is not configured');
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    throw new PortalContentUploadError('File storage is not configured');
  }

  const bucket = getPortalUploadBucketName();
  const { data, error } = await supabase.storage.from(bucket).download(storageKey);

  if (error || !data) {
    throw new PortalContentUploadError(error?.message || 'File not found in storage');
  }

  return Buffer.from(await data.arrayBuffer());
}

export function portalContentUploadDownloadHeaders(fileName: string, mimeType: string): HeadersInit {
  const safeName = fileName.replace(/["\r\n]/g, '_');
  return {
    'Content-Type': mimeType,
    'Content-Disposition': `attachment; filename="${safeName}"`,
    'Cache-Control': 'private, no-store',
  };
}

export async function getPortalContentUploads(
  portalUserId: string,
  projectId?: string | null
): Promise<PortalContentUploadItem[]> {
  if (!projectId) {
    return [];
  }

  const rows = await prisma.portalContentUpload.findMany({
    where: {
      projectId,
      project: { portalUserId },
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      fileName: true,
      mimeType: true,
      sizeBytes: true,
      createdAt: true,
    },
  });

  return rows.map(mapUploadRow);
}

function buildStorageObjectPath(
  portalUserId: string,
  fileName: string,
  projectId?: string | null
): string {
  const prefix = projectId ? `${portalUserId}/${projectId}` : portalUserId;
  return `${prefix}/${randomUUID()}-${fileName}`;
}

export async function savePortalContentUpload(
  portalUserId: string,
  file: File,
  projectId?: string | null
): Promise<PortalContentUploadItem> {
  if (!projectId) {
    throw new PortalContentUploadError('Project is required');
  }

  // For project-scoped uploads, the project's owning portalUserId is the
  // source of truth for how we associate the uploaded record.
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { portalUserId: true },
  });

  if (!project) {
    throw new PortalContentUploadError('Project not found');
  }
  const resolvedPortalUserId = project.portalUserId;

  if (!isSupabaseStorageConfigured()) {
    throw new PortalContentUploadError('File storage is not configured');
  }

  if (file.size === 0) {
    throw new PortalContentUploadError('File is empty');
  }
  if (file.size > PORTAL_UPLOAD_MAX_BYTES) {
    throw new PortalContentUploadError(
      `File exceeds the ${formatPortalUploadSize(PORTAL_UPLOAD_MAX_BYTES)} limit`
    );
  }

  const safeName = sanitizePortalUploadFileName(file.name);
  if (!isPortalUploadExtensionAllowed(safeName)) {
    throw new PortalContentUploadError('File type is not allowed');
  }

  const mimeType = resolvePortalUploadMimeType(safeName, file.type);
  if (!mimeType) {
    throw new PortalContentUploadError('File type is not allowed');
  }

  const storageKey = buildStorageObjectPath(resolvedPortalUserId, safeName, projectId);
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    throw new PortalContentUploadError('File storage is not configured');
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const bucket = getPortalUploadBucketName();

  const { error: uploadError } = await supabase.storage.from(bucket).upload(storageKey, buffer, {
    contentType: mimeType,
    upsert: false,
  });

  if (uploadError) {
    throw new PortalContentUploadError(uploadError.message || 'Upload to storage failed');
  }

  try {
    const record = await prisma.portalContentUpload.create({
      data: {
        projectId,
        fileName: safeName,
        storageKey,
        mimeType,
        sizeBytes: file.size,
      },
      select: {
        id: true,
        fileName: true,
        mimeType: true,
        sizeBytes: true,
        createdAt: true,
      },
    });

    return mapUploadRow(record);
  } catch (error) {
    await supabase.storage.from(bucket).remove([storageKey]);
    throw error;
  }
}

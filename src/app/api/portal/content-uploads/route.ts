import { NextResponse } from 'next/server';
import { getPortalSession } from '@/lib/portal-auth';
import {
  areAllPortalAgreementsSignedForProject,
  PORTAL_PROJECT_AGREEMENTS_UNSIGNED_MESSAGE,
} from '@/lib/portal-project-agreement-gate';
import { portalUserOwnsProject } from '@/lib/portal-project-access';
import { isPortalAdminRole } from '@/lib/portal-role-data';
import {
  getPortalContentUploads,
  PORTAL_UPLOAD_MAX_FILES_PER_REQUEST,
  PortalContentUploadError,
  savePortalContentUpload,
} from '@/lib/portal-content-upload';
import {
  checkRateLimit,
  formatRetryAfter,
  getClientIp,
  isPortalRateLimitEnabled,
} from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const session = await getPortalSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'You must be signed in' }, { status: 401 });
  }

  if (isPortalAdminRole(session.role)) {
    return NextResponse.json({ ok: false, error: 'Admin access required' }, { status: 403 });
  }

  const projectId = new URL(request.url).searchParams.get('projectId')?.trim() || null;
  if (!projectId) {
    return NextResponse.json({ ok: false, error: 'Project is required' }, { status: 400 });
  }

  if (!(await portalUserOwnsProject(session.userId, projectId))) {
    return NextResponse.json({ ok: false, error: 'Project not found' }, { status: 404 });
  }

  const uploads = await getPortalContentUploads(session.userId, projectId);
  return NextResponse.json({ ok: true, uploads });
}

export async function POST(request: Request) {
  const session = await getPortalSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'You must be signed in' }, { status: 401 });
  }

  if (isPortalAdminRole(session.role)) {
    return NextResponse.json({ ok: false, error: 'Only client accounts can upload files' }, { status: 403 });
  }

  const ip = getClientIp(request.headers);
  if (isPortalRateLimitEnabled()) {
    const burst = checkRateLimit(`portal-upload:${session.userId}:${ip}`, 30, 15 * 60 * 1000);
    if (!burst.allowed) {
      const retry = formatRetryAfter(burst.retryAfterSeconds);
      return NextResponse.json(
        { ok: false, error: `Too many uploads. Please try again in ${retry}.` },
        { status: 429, headers: { 'Retry-After': String(burst.retryAfterSeconds) } }
      );
    }
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid upload request' }, { status: 400 });
  }

  const projectId = formData.get('projectId');
  const resolvedProjectId =
    typeof projectId === 'string' && projectId.trim().length > 0 ? projectId.trim() : null;

  if (!resolvedProjectId) {
    return NextResponse.json({ ok: false, error: 'Project is required' }, { status: 400 });
  }

  if (!(await portalUserOwnsProject(session.userId, resolvedProjectId))) {
    return NextResponse.json({ ok: false, error: 'Project not found' }, { status: 404 });
  }

  const allSigned = await areAllPortalAgreementsSignedForProject(session.userId, resolvedProjectId);
  if (!allSigned) {
    return NextResponse.json({ ok: false, error: PORTAL_PROJECT_AGREEMENTS_UNSIGNED_MESSAGE }, { status: 403 });
  }

  const files = formData
    .getAll('files')
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (files.length === 0) {
    return NextResponse.json({ ok: false, error: 'Select at least one file to upload' }, { status: 400 });
  }

  if (files.length > PORTAL_UPLOAD_MAX_FILES_PER_REQUEST) {
    return NextResponse.json(
      {
        ok: false,
        error: `You can upload up to ${PORTAL_UPLOAD_MAX_FILES_PER_REQUEST} files at a time`,
      },
      { status: 400 }
    );
  }

  const uploads = [];
  const errors: string[] = [];

  for (const file of files) {
    try {
      uploads.push(await savePortalContentUpload(session.userId, file, resolvedProjectId));
    } catch (error) {
      const message =
        error instanceof PortalContentUploadError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Upload failed';
      errors.push(`${file.name}: ${message}`);
    }
  }

  if (uploads.length === 0) {
    return NextResponse.json(
      { ok: false, error: errors[0] ?? 'Upload failed' },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    uploads,
    errors: errors.length > 0 ? errors : undefined,
  });
}

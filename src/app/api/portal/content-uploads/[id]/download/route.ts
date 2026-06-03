import { NextResponse } from 'next/server';
import { getPortalSession } from '@/lib/portal-auth';
import {
  loadPortalContentUploadForDownload,
  portalContentUploadDownloadResponse,
} from '@/lib/portal-content-upload-download';
import { PortalContentUploadError } from '@/lib/portal-content-upload';
import { isPortalAdminRole } from '@/lib/portal-role-data';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await getPortalSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'You must be signed in' }, { status: 401 });
  }

  if (isPortalAdminRole(session.role)) {
    return NextResponse.json({ ok: false, error: 'Use the admin portal to access client files' }, { status: 403 });
  }

  const { id: uploadId } = await context.params;

  try {
    const file = await loadPortalContentUploadForDownload({
      uploadId,
      portalUserId: session.userId,
    });
    return portalContentUploadDownloadResponse(file.buffer, file.fileName, file.mimeType);
  } catch (error) {
    if (error instanceof PortalContentUploadError) {
      return NextResponse.json({ ok: false, error: 'File not found' }, { status: 404 });
    }
    throw error;
  }
}

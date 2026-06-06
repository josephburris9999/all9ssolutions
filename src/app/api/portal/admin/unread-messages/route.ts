import { NextResponse } from 'next/server';
import { getPortalAdminUnreadMessageProjects } from '@/lib/portal-admin-unread-messages';
import { getPortalSession } from '@/lib/portal-auth';
import { isPortalAdminRole } from '@/lib/portal-role-data';

export const runtime = 'nodejs';

export async function GET() {
  const session = await getPortalSession();

  if (!session) {
    return NextResponse.json({ ok: false, error: 'You must be signed in' }, { status: 401 });
  }

  if (!isPortalAdminRole(session.role)) {
    return NextResponse.json({ ok: false, error: 'Admin access required' }, { status: 403 });
  }

  const projects = await getPortalAdminUnreadMessageProjects();

  return NextResponse.json({
    ok: true,
    hasUnviewed: projects.length > 0,
    projects,
  });
}

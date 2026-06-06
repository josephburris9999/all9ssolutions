import { NextResponse } from 'next/server';
import { markProgressMessagesViewedForProject } from '@/lib/portal-admin-unread-messages';
import { getPortalSession } from '@/lib/portal-auth';
import { isPortalAdminRole } from '@/lib/portal-role-data';
import { resolvePortalSupportProjectForSession } from '@/lib/portal-support';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const session = await getPortalSession();

  if (!session) {
    return NextResponse.json({ ok: false, error: 'You must be signed in' }, { status: 401 });
  }

  if (!isPortalAdminRole(session.role)) {
    return NextResponse.json({ ok: false, error: 'Admin access required' }, { status: 403 });
  }

  const { projectId } = await context.params;
  const access = await resolvePortalSupportProjectForSession(session, projectId);

  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.error }, { status: access.status });
  }

  const markedCount = await markProgressMessagesViewedForProject(access.projectId);

  return NextResponse.json({ ok: true, markedCount });
}

import { NextResponse } from 'next/server';
import {
  saveConsultationDiscussion,
  SaveConsultationDiscussionError,
} from '@/lib/portal-admin-consultation-discussion';
import { getPortalSession } from '@/lib/portal-auth';
import { isPortalAdminRole } from '@/lib/portal-role-data';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  const session = await getPortalSession();

  if (!session) {
    return NextResponse.json({ ok: false, error: 'You must be signed in' }, { status: 401 });
  }

  if (!isPortalAdminRole(session.role)) {
    return NextResponse.json({ ok: false, error: 'Admin access required' }, { status: 403 });
  }

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body' }, { status: 400 });
  }

  try {
    const discussion = await saveConsultationDiscussion(id, body);

    return NextResponse.json({
      ok: true,
      discussion,
    });
  } catch (error) {
    if (error instanceof SaveConsultationDiscussionError) {
      const status =
        error.code === 'NOT_FOUND' ? 404 : error.code === 'LOCKED' ? 409 : 400;
      return NextResponse.json({ ok: false, error: error.message }, { status });
    }

    throw error;
  }
}

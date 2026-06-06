import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { completeProject, CompleteProjectError } from '@/lib/portal-admin-complete-project';
import { getPortalAdminClientCategoryCounts } from '@/lib/portal-admin-consultations';
import { getPortalSession } from '@/lib/portal-auth';
import { isPortalAdminRole } from '@/lib/portal-role-data';

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

  try {
    const result = await completeProject(projectId);

    revalidatePath('/portal/admin/clients/current', 'page');
    revalidatePath('/portal/admin/clients/completed', 'page');
    revalidatePath('/portal/admin', 'layout');
    revalidatePath(
      `/portal/admin/clients/current/${encodeURIComponent(result.consultationRequestId)}`,
      'page'
    );

    const categoryCounts = await getPortalAdminClientCategoryCounts();

    return NextResponse.json({ ok: true, categoryCounts });
  } catch (error) {
    if (error instanceof CompleteProjectError) {
      const status = error.code === 'NOT_FOUND' ? 404 : 400;
      return NextResponse.json({ ok: false, error: error.message }, { status });
    }

    throw error;
  }
}

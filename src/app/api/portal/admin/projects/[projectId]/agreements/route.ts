import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import {
  addProjectAgreement,
  addProjectAgreementSchema,
  AddProjectAgreementError,
} from '@/lib/portal-admin-add-project-agreement';
import { getPortalSession } from '@/lib/portal-auth';
import { isPortalAdminRole } from '@/lib/portal-role-data';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const session = await getPortalSession();

  if (!session) {
    return NextResponse.json({ ok: false, error: 'You must be signed in' }, { status: 401 });
  }

  if (!isPortalAdminRole(session.role)) {
    return NextResponse.json({ ok: false, error: 'Admin access required' }, { status: 403 });
  }

  const { projectId } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = addProjectAgreementSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Invalid agreement details';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }

  try {
    const result = await addProjectAgreement(projectId, parsed.data);

    revalidatePath('/portal/admin/clients/current', 'page');
    revalidatePath(
      `/portal/admin/clients/current/${encodeURIComponent(result.consultationRequestId)}`,
      'page'
    );

    return NextResponse.json({
      ok: true,
      agreement: result.agreement,
      estimatedCompletionAt: result.estimatedCompletionAt,
    });
  } catch (error) {
    if (error instanceof AddProjectAgreementError) {
      const status = error.code === 'NOT_FOUND' ? 404 : 400;
      return NextResponse.json({ ok: false, error: error.message }, { status });
    }

    throw error;
  }
}

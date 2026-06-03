import { NextResponse } from 'next/server';
import {
  PortalUserProvisionError,
  provisionPortalUserForConsultation,
} from '@/lib/portal-provision-user';
import { getPortalSession } from '@/lib/portal-auth';
import { isPortalAdminRole } from '@/lib/portal-role-data';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const session = await getPortalSession();

  if (!session) {
    return NextResponse.json({ ok: false, error: 'You must be signed in' }, { status: 401 });
  }

  if (!isPortalAdminRole(session.role)) {
    return NextResponse.json({ ok: false, error: 'Admin access required' }, { status: 403 });
  }

  const { id } = await context.params;

  try {
    const result = await provisionPortalUserForConsultation(id);

    return NextResponse.json({
      ok: true,
      portalUserId: result.portalUserId,
      created: result.created,
      linkedExistingUser: result.linkedExistingUser,
      temporaryPassword: result.temporaryPassword,
    });
  } catch (error) {
    if (error instanceof PortalUserProvisionError) {
      const status = error.code === 'NOT_FOUND' ? 404 : 409;
      return NextResponse.json({ ok: false, error: error.message }, { status });
    }

    throw error;
  }
}

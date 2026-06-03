import { NextResponse } from 'next/server';
import { portalAdminCompanySchema } from '@/lib/portal-admin-company-schema';
import { getPortalSession } from '@/lib/portal-auth';
import { isPortalAdminRole } from '@/lib/portal-role-data';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
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

  const parsed = portalAdminCompanySchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Invalid company name';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }

  const existing = await prisma.consultationRequest.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ ok: false, error: 'Consultation not found' }, { status: 404 });
  }

  const company = parsed.data.company.trim();

  const updated = await prisma.consultationRequest.update({
    where: { id },
    data: { company: company.length > 0 ? company : null },
    select: { company: true },
  });

  return NextResponse.json({
    ok: true,
    company: updated.company,
  });
}

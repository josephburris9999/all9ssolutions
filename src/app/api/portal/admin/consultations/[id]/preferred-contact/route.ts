import { NextResponse } from 'next/server';
import { formatPhoneNumber } from '@/lib/phone';
import { portalAdminPreferredContactSchema } from '@/lib/portal-admin-preferred-contact-schema';
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

  const parsed = portalAdminPreferredContactSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Invalid preferred contact value';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }

  const existing = await prisma.consultationRequest.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ ok: false, error: 'Consultation not found' }, { status: 404 });
  }

  const includesPhoneTimezone =
    parsed.data.preferredContact === 'p' ||
    parsed.data.phone !== undefined ||
    parsed.data.timezone !== undefined;

  const updateData = includesPhoneTimezone
    ? {
        preferredContact: 'p' as const,
        phone: formatPhoneNumber(parsed.data.phone ?? ''),
        timezone: parsed.data.timezone!.trim(),
      }
    : {
        preferredContact: parsed.data.preferredContact,
      };

  const updated = await prisma.consultationRequest.update({
    where: { id },
    data: updateData,
    select: {
      preferredContact: true,
      phone: true,
      timezone: true,
    },
  });

  return NextResponse.json({
    ok: true,
    preferredContact: updated.preferredContact === 'p' ? 'p' : 'e',
    phone: updated.phone,
    timezone: updated.timezone,
  });
}

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { consultationFormSchema } from '@/lib/consultation-schema';
import { getPortalAdminClientCategoryCounts } from '@/lib/portal-admin-consultations';
import { getPortalSession } from '@/lib/portal-auth';
import { isPortalAdminRole } from '@/lib/portal-role-data';
import { findLinkedPortalUserIdByConsultationEmail } from '@/lib/portal-user';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const session = await getPortalSession();

  if (!session) {
    return NextResponse.json({ ok: false, error: 'You must be signed in' }, { status: 401 });
  }

  if (!isPortalAdminRole(session.role)) {
    return NextResponse.json({ ok: false, error: 'Admin access required' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = consultationFormSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Invalid consultation details';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }

  const data = parsed.data;
  const { prisma } = await import('@/lib/prisma');
  const portalUserId = await findLinkedPortalUserIdByConsultationEmail(data.email);

  const consultation = await prisma.consultationRequest.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      timezone: data.timezone || null,
      preferredContact: data.preferredContact,
      company: data.company || null,
      message: data.message,
      ...(portalUserId ? { portalUserId } : {}),
    },
    select: { id: true },
  });

  revalidatePath('/portal/admin', 'layout');
  const categoryCounts = await getPortalAdminClientCategoryCounts();

  return NextResponse.json({
    ok: true,
    consultationRequestId: consultation.id,
    categoryCounts,
  });
}

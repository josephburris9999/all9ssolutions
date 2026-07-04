import { NextResponse } from 'next/server';
import { Prisma } from '@/generated/prisma/client';
import { getPortalSession } from '@/lib/portal-auth';
import { isPortalAdminRole } from '@/lib/portal-role-data';
import {
  sendPortalPaymentEmails,
  type PortalPaymentEmailDetails,
} from '@/lib/portal-payment-email';

type PaymentReturnBody = {
  paymentId?: unknown;
  status?: unknown;
};

async function markPortalPaymentFailed(input: {
  paymentId: string;
  portalUserId: string;
}): Promise<PortalPaymentEmailDetails | null> {
  const { prisma } = await import('@/lib/prisma');

  return prisma.$transaction(async (tx) => {
    const updated = await tx.$queryRaw<Array<{ paymentId: string }>>(
      Prisma.sql`
        UPDATE "PortalPayment"
        SET "status" = 'FAILED'::"PortalPaymentStatus", "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = ${input.paymentId}
          AND "portalUserId" = ${input.portalUserId}
          AND "status" = 'PENDING'::"PortalPaymentStatus"
        RETURNING id AS "paymentId"
      `
    );

    if (!updated[0]) {
      return null;
    }

    const details = await tx.$queryRaw<Array<{
      paymentId: string;
      projectTitle: string;
      clientName: string;
      clientEmail: string;
      amountCents: number;
      currency: string;
      checkoutSessionId: string | null;
      paymentIntentId: string | null;
    }>>(
      Prisma.sql`
        SELECT
          pp.id AS "paymentId",
          p.title AS "projectTitle",
          cr.name AS "clientName",
          cr.email AS "clientEmail",
          pp."amountCents" AS "amountCents",
          pp.currency AS "currency",
          pp."stripeCheckoutSessionId" AS "checkoutSessionId",
          pp."stripePaymentIntentId" AS "paymentIntentId"
        FROM "PortalPayment" pp
        INNER JOIN "Project" p ON p.id = pp."projectId"
        INNER JOIN "ConsultationRequest" cr ON cr.id = p."consultationRequestId"
        WHERE pp.id = ${input.paymentId}
        LIMIT 1
      `
    );

    const row = details[0];
    if (!row) return null;

    return {
      paymentId: row.paymentId,
      projectTitle: row.projectTitle,
      clientName: row.clientName,
      clientEmail: row.clientEmail,
      amountCents: row.amountCents,
      currency: row.currency,
      checkoutSessionId: row.checkoutSessionId,
      paymentIntentId: row.paymentIntentId,
      status: 'failed',
    };
  });
}

export async function POST(request: Request) {
  const session = await getPortalSession();
  if (!session || isPortalAdminRole(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as PaymentReturnBody;
  const paymentId = typeof body.paymentId === 'string' ? body.paymentId.trim() : '';
  const status = typeof body.status === 'string' ? body.status.trim() : '';

  if (!paymentId || status !== 'failed') {
    return NextResponse.json({ error: 'Invalid payment return' }, { status: 400 });
  }

  const paymentDetails = await markPortalPaymentFailed({
    paymentId,
    portalUserId: session.userId,
  });

  if (paymentDetails) {
    await sendPortalPaymentEmails(paymentDetails);
  }

  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@/generated/prisma/client';
import {
  getStripeWebhookSecret,
  type StripeCheckoutSession,
  verifyStripeWebhookPayload,
} from '@/lib/stripe-checkout';
import {
  sendPortalPaymentEmails,
  type PortalPaymentEmailDetails,
} from '@/lib/portal-payment-email';

type StripeEvent = {
  id: string;
  type: string;
  data?: {
    object?: unknown;
  };
};

function getPaymentIntentId(session: StripeCheckoutSession): string | null {
  return typeof session.payment_intent === 'string' ? session.payment_intent : null;
}

function getMetadataValue(session: StripeCheckoutSession, key: string): string {
  return session.metadata?.[key]?.trim() ?? '';
}

async function completePortalPayment(input: {
  paymentId: string;
  checkoutSessionId: string;
  paymentIntentId: string | null;
  stripeEventId: string;
}): Promise<PortalPaymentEmailDetails | null> {
  const { prisma } = await import('@/lib/prisma');
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<Array<{ projectId: string; amountCents: number }>>(
      Prisma.sql`
        UPDATE "PortalPayment"
        SET
          "status" = 'COMPLETED'::"PortalPaymentStatus",
          "stripeCheckoutSessionId" = COALESCE("stripeCheckoutSessionId", ${input.checkoutSessionId}),
          "stripePaymentIntentId" = ${input.paymentIntentId},
          "stripeEventId" = ${input.stripeEventId},
          "completedAt" = CURRENT_TIMESTAMP,
          "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = ${input.paymentId}
          AND "status" <> 'COMPLETED'::"PortalPaymentStatus"
        RETURNING "projectId", "amountCents"
      `
    );

    const payment = rows[0];
    if (!payment) {
      return null;
    }

    const paidAmount = payment.amountCents / 100;
    await tx.$executeRaw(
      Prisma.sql`
        UPDATE "Project"
        SET "paidAmount" = COALESCE("paidAmount", 0) + ${paidAmount}, "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = ${payment.projectId}
      `
    );

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
      status: 'completed',
    };
  });
}

async function expirePortalPayment(input: {
  paymentId: string;
  checkoutSessionId: string;
  stripeEventId: string;
}): Promise<PortalPaymentEmailDetails | null> {
  const { prisma } = await import('@/lib/prisma');
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<Array<{ paymentId: string }>>(
      Prisma.sql`
        UPDATE "PortalPayment"
        SET
          "status" = 'FAILED'::"PortalPaymentStatus",
          "stripeCheckoutSessionId" = COALESCE("stripeCheckoutSessionId", ${input.checkoutSessionId}),
          "stripeEventId" = ${input.stripeEventId},
          "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = ${input.paymentId}
          AND "status" = 'PENDING'::"PortalPaymentStatus"
        RETURNING id AS "paymentId"
      `
    );

    if (!rows[0]) {
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

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!verifyStripeWebhookPayload(payload, signature, getStripeWebhookSecret())) {
    return NextResponse.json({ error: 'Invalid Stripe signature' }, { status: 400 });
  }

  const event = JSON.parse(payload) as StripeEvent;
  if (event.type !== 'checkout.session.completed' && event.type !== 'checkout.session.expired') {
    return NextResponse.json({ received: true });
  }

  const checkoutSession = event.data?.object as StripeCheckoutSession | undefined;
  if (!checkoutSession?.id) {
    return NextResponse.json({ received: true });
  }

  const paymentId = getMetadataValue(checkoutSession, 'paymentId');
  if (!paymentId) {
    return NextResponse.json({ error: 'Missing payment metadata' }, { status: 400 });
  }

  const paymentDetails =
    event.type === 'checkout.session.completed'
      ? checkoutSession.payment_status === 'paid'
        ? await completePortalPayment({
            paymentId,
            checkoutSessionId: checkoutSession.id,
            paymentIntentId: getPaymentIntentId(checkoutSession),
            stripeEventId: event.id,
          })
        : null
      : await expirePortalPayment({
          paymentId,
          checkoutSessionId: checkoutSession.id,
          stripeEventId: event.id,
        });

  if (paymentDetails) {
    await sendPortalPaymentEmails(paymentDetails);
  }

  return NextResponse.json({ received: true });
}

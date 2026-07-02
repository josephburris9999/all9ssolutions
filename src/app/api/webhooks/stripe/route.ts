import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@/generated/prisma/client';
import {
  getStripeWebhookSecret,
  type StripeCheckoutSession,
  verifyStripeWebhookPayload,
} from '@/lib/stripe-checkout';

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
}) {
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
      return;
    }

    const paidAmount = payment.amountCents / 100;
    await tx.$executeRaw(
      Prisma.sql`
        UPDATE "Project"
        SET "paidAmount" = COALESCE("paidAmount", 0) + ${paidAmount}, "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = ${payment.projectId}
      `
    );
  });
}

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!verifyStripeWebhookPayload(payload, signature, getStripeWebhookSecret())) {
    return NextResponse.json({ error: 'Invalid Stripe signature' }, { status: 400 });
  }

  const event = JSON.parse(payload) as StripeEvent;
  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true });
  }

  const checkoutSession = event.data?.object as StripeCheckoutSession | undefined;
  if (!checkoutSession?.id || checkoutSession.payment_status !== 'paid') {
    return NextResponse.json({ received: true });
  }

  const paymentId = getMetadataValue(checkoutSession, 'paymentId');
  if (!paymentId) {
    return NextResponse.json({ error: 'Missing payment metadata' }, { status: 400 });
  }

  await completePortalPayment({
    paymentId,
    checkoutSessionId: checkoutSession.id,
    paymentIntentId: getPaymentIntentId(checkoutSession),
    stripeEventId: event.id,
  });

  return NextResponse.json({ received: true });
}

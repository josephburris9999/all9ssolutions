import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@/generated/prisma/client';
import { areAllPortalAgreementsSigned } from '@/lib/portal-agreement-data';
import { calculateClientLedgerTotalDue } from '@/lib/portal-amount-due-data';
import { getPortalSession } from '@/lib/portal-auth';
import { isPortalAdminRole, portalProjectDashboardHref } from '@/lib/portal-role-data';
import {
  createStripeCheckoutSession,
  getStripeCurrency,
  type StripeCheckoutSession,
} from '@/lib/stripe-checkout';

type CheckoutRequestBody = {
  projectId?: unknown;
};

type PrismaClientInstance = typeof import('@/lib/prisma').prisma;

function getCheckoutOrigin(request: NextRequest): string {
  return process.env.PORTAL_APP_URL?.trim() || request.nextUrl.origin;
}

function buildCheckoutReturnUrl(
  request: NextRequest,
  projectId: string,
  paymentId: string,
  status: 'success' | 'failed'
) {
  const url = new URL(portalProjectDashboardHref('/portal/dashboard', projectId), getCheckoutOrigin(request));
  url.searchParams.set('payment', status);
  url.searchParams.set('paymentId', paymentId);
  return url.toString();
}

async function createPendingPortalPayment(input: {
  prisma: PrismaClientInstance;
  paymentId: string;
  projectId: string;
  portalUserId: string;
  amountCents: number;
  currency: string;
}) {
  await input.prisma.$executeRaw(
    Prisma.sql`
      INSERT INTO "PortalPayment" ("id", "projectId", "portalUserId", "amountCents", "currency", "status")
      VALUES (${input.paymentId}, ${input.projectId}, ${input.portalUserId}, ${input.amountCents}, ${input.currency}, 'PENDING'::"PortalPaymentStatus")
    `
  );
}

async function attachCheckoutSessionToPayment(paymentId: string, checkoutSessionId: string) {
  const { prisma } = await import('@/lib/prisma');
  await prisma.$executeRaw(
    Prisma.sql`
      UPDATE "PortalPayment"
      SET "stripeCheckoutSessionId" = ${checkoutSessionId}, "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${paymentId}
    `
  );
}

async function markPaymentFailed(paymentId: string) {
  const { prisma } = await import('@/lib/prisma');
  await prisma.$executeRaw(
    Prisma.sql`
      UPDATE "PortalPayment"
      SET "status" = 'FAILED'::"PortalPaymentStatus", "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${paymentId}
        AND "status" = 'PENDING'::"PortalPaymentStatus"
    `
  );
}

export async function POST(request: NextRequest) {
  const session = await getPortalSession();
  if (!session || isPortalAdminRole(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as CheckoutRequestBody;
  const projectId = typeof body.projectId === 'string' ? body.projectId.trim() : '';
  if (!projectId) {
    return NextResponse.json({ error: 'Project is required' }, { status: 400 });
  }

  const { getClientPortalProjectForUser } = await import('@/lib/portal-projects');
  const project = await getClientPortalProjectForUser(projectId, session.userId);
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const { listPortalAgreementsForClientProject } = await import('@/lib/project-agreement-store');
  const agreements = await listPortalAgreementsForClientProject(session.userId, projectId);
  if (!areAllPortalAgreementsSigned(agreements)) {
    return NextResponse.json({ error: 'All agreements must be signed before payment' }, { status: 409 });
  }

  const { getPortalAmountSummary } = await import('@/lib/portal-amount-due');
  const amounts = await getPortalAmountSummary(session.userId, projectId);
  const totalDue = calculateClientLedgerTotalDue(amounts);
  const amountCents = Math.round(totalDue * 100);
  if (amountCents <= 0) {
    return NextResponse.json({ error: 'There is no balance due for this project' }, { status: 400 });
  }

  const currency = getStripeCurrency();
  const paymentId = randomUUID();
  const { prisma } = await import('@/lib/prisma');
  await createPendingPortalPayment({
    prisma,
    paymentId,
    projectId,
    portalUserId: session.userId,
    amountCents,
    currency,
  });

  let checkoutSession: StripeCheckoutSession;
  try {
    checkoutSession = await createStripeCheckoutSession({
      amountCents,
      currency,
      customerEmail: session.email,
      description: `all9s Solutions payment - ${project.title}`,
      paymentId,
      portalUserId: session.userId,
      projectId,
      successUrl: buildCheckoutReturnUrl(request, projectId, paymentId, 'success'),
      cancelUrl: buildCheckoutReturnUrl(request, projectId, paymentId, 'failed'),
    });
  } catch (error) {
    await markPaymentFailed(paymentId);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unable to create Stripe Checkout session',
      },
      { status: 502 }
    );
  }

  if (!checkoutSession.url) {
    return NextResponse.json({ error: 'Stripe did not return a checkout URL' }, { status: 502 });
  }

  await attachCheckoutSessionToPayment(paymentId, checkoutSession.id);

  return NextResponse.json({ url: checkoutSession.url });
}

import 'server-only';

import { createHmac, timingSafeEqual } from 'crypto';

export type StripeCheckoutSession = {
  id: string;
  url: string | null;
  payment_intent?: string | null;
  payment_status?: string | null;
  metadata?: Record<string, string | undefined> | null;
};

type CreateCheckoutSessionInput = {
  amountCents: number;
  currency: string;
  customerEmail: string;
  description: string;
  paymentId: string;
  portalUserId: string;
  projectId: string;
  successUrl: string;
  cancelUrl: string;
};

export function getStripeCurrency(): string {
  return (process.env.STRIPE_CHECKOUT_CURRENCY ?? 'usd').trim().toLowerCase();
}

function getStripeSecretKey(): string {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  return secretKey;
}

export function getStripeWebhookSecret(): string {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set');
  }
  return webhookSecret;
}

function appendCheckoutLineItem(params: URLSearchParams, input: CreateCheckoutSessionInput) {
  params.set('line_items[0][quantity]', '1');
  params.set('line_items[0][price_data][currency]', input.currency);
  params.set('line_items[0][price_data][unit_amount]', String(input.amountCents));
  params.set('line_items[0][price_data][product_data][name]', input.description);
}

export async function createStripeCheckoutSession(
  input: CreateCheckoutSessionInput
): Promise<StripeCheckoutSession> {
  const params = new URLSearchParams();
  params.set('mode', 'payment');
  params.set('success_url', input.successUrl);
  params.set('cancel_url', input.cancelUrl);
  params.set('customer_email', input.customerEmail);
  params.set('client_reference_id', input.paymentId);
  params.set('metadata[paymentId]', input.paymentId);
  params.set('metadata[projectId]', input.projectId);
  params.set('metadata[portalUserId]', input.portalUserId);
  appendCheckoutLineItem(params, input);

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getStripeSecretKey()}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  const data = await response.json();
  if (!response.ok) {
    const message =
      typeof data?.error?.message === 'string'
        ? data.error.message
        : 'Unable to create Stripe Checkout session';
    throw new Error(message);
  }

  return data as StripeCheckoutSession;
}

function parseStripeSignatureHeader(signatureHeader: string): { timestamp: string; signatures: string[] } {
  const parts = signatureHeader.split(',');
  const timestamp = parts.find((part) => part.startsWith('t='))?.slice(2) ?? '';
  const signatures = parts
    .filter((part) => part.startsWith('v1='))
    .map((part) => part.slice(3))
    .filter(Boolean);

  return { timestamp, signatures };
}

function safeHexBuffer(value: string): Buffer | null {
  if (!/^[0-9a-f]+$/i.test(value) || value.length % 2 !== 0) {
    return null;
  }
  return Buffer.from(value, 'hex');
}

export function verifyStripeWebhookPayload(
  payload: string,
  signatureHeader: string | null,
  webhookSecret: string
): boolean {
  if (!signatureHeader) return false;

  const { timestamp, signatures } = parseStripeSignatureHeader(signatureHeader);
  if (!timestamp || signatures.length === 0) return false;

  const expected = createHmac('sha256', webhookSecret)
    .update(`${timestamp}.${payload}`)
    .digest('hex');
  const expectedBuffer = Buffer.from(expected, 'hex');

  return signatures.some((signature) => {
    const signatureBuffer = safeHexBuffer(signature);
    if (!signatureBuffer) return false;

    return (
      signatureBuffer.length === expectedBuffer.length &&
      timingSafeEqual(signatureBuffer, expectedBuffer)
    );
  });
}

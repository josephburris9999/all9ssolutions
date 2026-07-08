import 'server-only';

export type PortalPaymentEmailStatus = 'completed' | 'failed';

export type PortalPaymentEmailDetails = {
  paymentId: string;
  projectTitle: string;
  clientName: string;
  clientEmail: string;
  amountCents: number;
  currency: string;
  status: PortalPaymentEmailStatus;
  checkoutSessionId?: string | null;
  paymentIntentId?: string | null;
};

type SendPaymentEmailInput = PortalPaymentEmailDetails & {
  to: string;
  audience: 'client' | 'admin';
};

let cachedPaymentAdminEmails: string[] | null = null;
let paymentAdminEmailsLookup: Promise<string[]> | null = null;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatPaymentAmount(amountCents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountCents / 100);
}

function getPaymentAdminEmail(): string {
  return (
    process.env.PAYMENT_ADMIN_EMAIL?.trim() ||
    process.env.CONSULTATION_REPLY_TO?.trim() ||
    'hello@all9ssolutions.com'
  );
}

async function loadPaymentAdminEmails(): Promise<string[]> {
  const { prisma } = await import('@/lib/prisma');
  const adminRequests = await prisma.consultationRequest.findMany({
    where: {
      portalUser: {
        role: 'a',
      },
      email: {
        not: '',
      },
    },
    select: {
      email: true,
    },
  });

  const emails = adminRequests
    .map(({ email }) => email.trim().toLowerCase())
    .filter(Boolean);

  return Array.from(new Set(emails));
}

async function getPaymentAdminEmails(): Promise<string[]> {
  if (cachedPaymentAdminEmails) {
    return cachedPaymentAdminEmails;
  }

  if (!paymentAdminEmailsLookup) {
    paymentAdminEmailsLookup = loadPaymentAdminEmails()
      .then((emails) => {
        cachedPaymentAdminEmails = emails;
        return emails;
      })
      .finally(() => {
        paymentAdminEmailsLookup = null;
      });
  }

  try {
    return await paymentAdminEmailsLookup;
  } catch (error) {
    console.error('Failed to resolve payment admin emails:', error);
    return [];
  }
}

function buildPaymentEmail(input: SendPaymentEmailInput) {
  const amount = formatPaymentAmount(input.amountCents, input.currency);
  const projectTitle = input.projectTitle.trim() || 'Client project';
  const clientName = input.clientName.trim() || 'Client';
  const statusLabel = input.status === 'completed' ? 'Successful' : 'Unsuccessful';
  const subject =
    input.audience === 'admin'
      ? `${statusLabel} client payment - ${projectTitle}`
      : `${statusLabel} payment for ${projectTitle} - all9s Solutions`;

  const intro =
    input.status === 'completed'
      ? 'Your payment was successfully received.'
      : 'Your payment was not completed.';
  const adminIntro =
    input.status === 'completed'
      ? 'A client payment was successfully received.'
      : 'A client payment was not completed.';

  const html = `<!DOCTYPE html>
<html>
<body style="font-family:Inter,Segoe UI,sans-serif;line-height:1.6;color:#111827;max-width:560px;margin:0 auto;padding:24px;">
  <p>Hi ${input.audience === 'admin' ? 'all9s Solutions' : escapeHtml(clientName)},</p>
  <p>${input.audience === 'admin' ? adminIntro : intro}</p>
  <table style="width:100%;border-collapse:collapse;margin:24px 0;font-size:14px;">
    <tr><td style="padding:8px 0;color:#6b7280;">Status</td><td style="padding:8px 0;">${statusLabel}</td></tr>
    <tr><td style="padding:8px 0;color:#6b7280;">Project</td><td style="padding:8px 0;">${escapeHtml(projectTitle)}</td></tr>
    <tr><td style="padding:8px 0;color:#6b7280;">Amount</td><td style="padding:8px 0;">${escapeHtml(amount)}</td></tr>
    <tr><td style="padding:8px 0;color:#6b7280;">Client</td><td style="padding:8px 0;">${escapeHtml(clientName)} (${escapeHtml(input.clientEmail)})</td></tr>
    <tr><td style="padding:8px 0;color:#6b7280;">Payment ID</td><td style="padding:8px 0;">${escapeHtml(input.paymentId)}</td></tr>
    ${
      input.paymentIntentId
        ? `<tr><td style="padding:8px 0;color:#6b7280;">Stripe payment intent</td><td style="padding:8px 0;">${escapeHtml(input.paymentIntentId)}</td></tr>`
        : ''
    }
    ${
      input.checkoutSessionId
        ? `<tr><td style="padding:8px 0;color:#6b7280;">Stripe checkout session</td><td style="padding:8px 0;">${escapeHtml(input.checkoutSessionId)}</td></tr>`
        : ''
    }
  </table>
  <p style="font-size:14px;color:#6b7280;margin-top:32px;">If you have questions, reply to this email or contact us at <a href="mailto:hello@all9ssolutions.com">hello@all9ssolutions.com</a>.</p>
  <p style="font-size:14px;color:#6b7280;">- all9s Solutions</p>
</body>
</html>`;

  const text = [
    `Hi ${input.audience === 'admin' ? 'all9s Solutions' : clientName},`,
    '',
    input.audience === 'admin' ? adminIntro : intro,
    '',
    `Status: ${statusLabel}`,
    `Project: ${projectTitle}`,
    `Amount: ${amount}`,
    `Client: ${clientName} (${input.clientEmail})`,
    `Payment ID: ${input.paymentId}`,
    input.paymentIntentId ? `Stripe payment intent: ${input.paymentIntentId}` : null,
    input.checkoutSessionId ? `Stripe checkout session: ${input.checkoutSessionId}` : null,
    '',
    'Questions? Reply to this email or contact hello@all9ssolutions.com.',
    '',
    '- all9s Solutions',
  ]
    .filter((line): line is string => line !== null)
    .join('\n');

  return { subject, html, text };
}

async function sendPaymentEmail(input: SendPaymentEmailInput) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.CONSULTATION_CONFIRMATION_FROM?.trim();

  if (!apiKey || !from) {
    return { ok: false as const, skipped: true as const, error: 'Email not configured' };
  }

  const to = input.to.trim();
  if (!to) {
    return { ok: false as const, error: 'Recipient email is required' };
  }

  const { subject, html, text } = buildPaymentEmail(input);
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
      text,
      reply_to: process.env.CONSULTATION_REPLY_TO?.trim() || undefined,
    }),
  });

  let body: { message?: string } = {};
  try {
    body = (await res.json()) as typeof body;
  } catch {
    // ignore
  }

  if (!res.ok) {
    return {
      ok: false as const,
      error: typeof body.message === 'string' ? body.message : `Resend error (${res.status})`,
    };
  }

  return { ok: true as const };
}

export async function sendPortalPaymentEmails(details: PortalPaymentEmailDetails): Promise<void> {
  const adminEmails = await getPaymentAdminEmails();
  const adminRecipients = adminEmails.length > 0 ? adminEmails : [getPaymentAdminEmail()];

  const [clientResult, ...adminResults] = await Promise.all([
    sendPaymentEmail({ ...details, to: details.clientEmail, audience: 'client' }),
    ...adminRecipients.map((to) => sendPaymentEmail({ ...details, to, audience: 'admin' })),
  ]);

  if (!clientResult.ok && !clientResult.skipped) {
    console.error('Failed to send client payment email:', clientResult.error);
  }
  for (const adminResult of adminResults) {
    if (!adminResult.ok && !adminResult.skipped) {
      console.error('Failed to send admin payment email:', adminResult.error);
    }
  }
}

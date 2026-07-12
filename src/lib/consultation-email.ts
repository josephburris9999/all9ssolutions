export type ConsultationEmailPayload = {
  name: string;
  email: string;
  phone: string;
  timezone: string;
  preferredContact: 'e' | 'p';
  company: string;
  message: string;
};

type SendEmailResult =
  | { ok: true; resendEmailId: string }
  | { ok: false; error: string; skipped?: boolean };

async function getConsultationAdminRecipients(): Promise<string[]> {
  try {
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

    const portalAdminEmails = adminRequests
      .map(({ email }) => email.trim().toLowerCase())
      .filter(Boolean);

    return Array.from(new Set(portalAdminEmails));
  } catch (error) {
    console.error('Failed to resolve consultation admin emails:', error);
    return [];
  }
}

function formatPhoneForEmail(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length !== 10) return phone.trim() || '—';
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildConsultationConfirmationEmail(payload: ConsultationEmailPayload) {
  const preferred =
    payload.preferredContact === 'p' ? 'Phone' : 'Email';
  const phoneLine = payload.phone.trim()
    ? `<tr><td style="padding:8px 0;color:#6b7280;">Phone</td><td style="padding:8px 0;">${escapeHtml(formatPhoneForEmail(payload.phone))}</td></tr>`
    : '';
  const timezoneLine = payload.timezone.trim()
    ? `<tr><td style="padding:8px 0;color:#6b7280;">Timezone</td><td style="padding:8px 0;">${escapeHtml(payload.timezone)}</td></tr>`
    : '';
  const companyLine = payload.company.trim()
    ? `<tr><td style="padding:8px 0;color:#6b7280;">Company</td><td style="padding:8px 0;">${escapeHtml(payload.company)}</td></tr>`
    : '';

  const subject = 'We received your consultation request — all9s Solutions';
  const html = `<!DOCTYPE html>
<html>
<body style="font-family:Inter,Segoe UI,sans-serif;line-height:1.6;color:#111827;max-width:560px;margin:0 auto;padding:24px;">
  <p>Hi ${escapeHtml(payload.name)},</p>
  <p>Thank you for contacting <strong>all9s Solutions</strong>. We received your strategy consultation request and will reach out within <strong>one business day</strong>.</p>
  <table style="width:100%;border-collapse:collapse;margin:24px 0;font-size:14px;">
    <tr><td style="padding:8px 0;color:#6b7280;">Preferred contact</td><td style="padding:8px 0;">${preferred}</td></tr>
    ${phoneLine}
    ${timezoneLine}
    ${companyLine}
  </table>
  <p style="font-size:14px;color:#374151;"><strong>Your message</strong></p>
  <p style="font-size:14px;white-space:pre-wrap;background:#f3f4f6;padding:16px;border-radius:8px;">${escapeHtml(payload.message)}</p>
  <p style="font-size:14px;color:#6b7280;margin-top:32px;">If you have questions in the meantime, reply to this email or contact us at <a href="mailto:hello@all9ssolutions.com">hello@all9ssolutions.com</a>.</p>
  <p style="font-size:14px;color:#6b7280;">— all9s Solutions</p>
</body>
</html>`;

  const text = [
    `Hi ${payload.name},`,
    '',
    'Thank you for contacting all9s Solutions. We received your strategy consultation request and will reach out within one business day.',
    '',
    `Preferred contact: ${preferred}`,
    payload.phone.trim() ? `Phone: ${formatPhoneForEmail(payload.phone)}` : null,
    payload.timezone.trim() ? `Timezone: ${payload.timezone}` : null,
    payload.company.trim() ? `Company: ${payload.company}` : null,
    '',
    'Your message:',
    payload.message,
    '',
    'Questions? Reply to this email or contact hello@all9ssolutions.com.',
    '',
    '— all9s Solutions',
  ]
    .filter((line): line is string => line !== null)
    .join('\n');

  return { subject, html, text };
}

export function buildConsultationAdminEmail(payload: ConsultationEmailPayload) {
  const preferred = payload.preferredContact === 'p' ? 'Phone' : 'Email';
  const phone = payload.phone.trim() ? formatPhoneForEmail(payload.phone) : '-';
  const timezone = payload.timezone.trim() || '-';
  const company = payload.company.trim() || '-';
  const subject = `New consultation request - ${payload.name}`;
  const html = `<!DOCTYPE html>
<html>
<body style="font-family:Inter,Segoe UI,sans-serif;line-height:1.6;color:#111827;max-width:640px;margin:0 auto;padding:24px;">
  <p>Hi all9s Solutions,</p>
  <p>A new consultation request was submitted.</p>
  <table style="width:100%;border-collapse:collapse;margin:24px 0;font-size:14px;">
    <tr><td style="padding:8px 0;color:#6b7280;">Name</td><td style="padding:8px 0;">${escapeHtml(payload.name)}</td></tr>
    <tr><td style="padding:8px 0;color:#6b7280;">Email</td><td style="padding:8px 0;">${escapeHtml(payload.email)}</td></tr>
    <tr><td style="padding:8px 0;color:#6b7280;">Phone</td><td style="padding:8px 0;">${escapeHtml(phone)}</td></tr>
    <tr><td style="padding:8px 0;color:#6b7280;">Company</td><td style="padding:8px 0;">${escapeHtml(company)}</td></tr>
    <tr><td style="padding:8px 0;color:#6b7280;">Timezone</td><td style="padding:8px 0;">${escapeHtml(timezone)}</td></tr>
    <tr><td style="padding:8px 0;color:#6b7280;">Preferred contact</td><td style="padding:8px 0;">${preferred}</td></tr>
  </table>
  <p style="font-size:14px;color:#374151;"><strong>Message</strong></p>
  <p style="font-size:14px;white-space:pre-wrap;background:#f3f4f6;padding:16px;border-radius:8px;">${escapeHtml(payload.message)}</p>
  <p style="font-size:14px;color:#6b7280;margin-top:32px;">Open the admin portal to review and manage this consultation request.</p>
</body>
</html>`;

  const text = [
    'Hi all9s Solutions,',
    '',
    'A new consultation request was submitted.',
    '',
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
    `Phone: ${phone}`,
    `Company: ${company}`,
    `Timezone: ${timezone}`,
    `Preferred contact: ${preferred}`,
    '',
    'Message:',
    payload.message,
    '',
    'Open the admin portal to review and manage this consultation request.',
  ].join('\n');

  return { subject, html, text };
}

export async function sendConsultationConfirmationEmail(
  payload: ConsultationEmailPayload
): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.CONSULTATION_CONFIRMATION_FROM?.trim();

  if (!apiKey || !from) {
    return { ok: false, error: 'Email not configured', skipped: true };
  }

  const { subject, html, text } = buildConsultationConfirmationEmail(payload);

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [payload.email],
      subject,
      html,
      text,
      reply_to: process.env.CONSULTATION_REPLY_TO?.trim() || undefined,
    }),
  });

  let body: { id?: string; message?: string } = {};
  try {
    body = (await res.json()) as typeof body;
  } catch {
    // ignore
  }

  if (!res.ok) {
    return {
      ok: false,
      error: typeof body.message === 'string' ? body.message : `Resend error (${res.status})`,
    };
  }

  const resendEmailId = typeof body.id === 'string' ? body.id.trim() : '';
  if (!resendEmailId) {
    return { ok: false, error: 'Resend did not return an email id' };
  }

  return { ok: true, resendEmailId };
}

export async function sendConsultationAdminEmail(
  payload: ConsultationEmailPayload
): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.CONSULTATION_CONFIRMATION_FROM?.trim();

  if (!apiKey || !from) {
    return { ok: false, error: 'Email not configured', skipped: true };
  }

  const recipients = await getConsultationAdminRecipients();
  if (recipients.length === 0) {
    return { ok: false, error: 'No consultation admin recipients configured', skipped: true };
  }

  const { subject, html, text } = buildConsultationAdminEmail(payload);

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: recipients,
      subject,
      html,
      text,
      reply_to: payload.email.trim() || process.env.CONSULTATION_REPLY_TO?.trim() || undefined,
    }),
  });

  let body: { id?: string; message?: string } = {};
  try {
    body = (await res.json()) as typeof body;
  } catch {
    // ignore
  }

  if (!res.ok) {
    return {
      ok: false,
      error: typeof body.message === 'string' ? body.message : `Resend error (${res.status})`,
    };
  }

  const resendEmailId = typeof body.id === 'string' ? body.id.trim() : '';
  if (!resendEmailId) {
    return { ok: false, error: 'Resend did not return an email id' };
  }

  return { ok: true, resendEmailId };
}

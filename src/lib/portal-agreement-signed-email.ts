import { PORTAL_AGREEMENT_TITLE } from '@/lib/portal-agreement';

import {
  CLIENT_AGREEMENT_PDF_FILENAME,
  PORTAL_CLIENT_SERVICE_AGREEMENT_PDF_FILENAME,
} from '@/lib/portal-agreement-filename';

export { CLIENT_AGREEMENT_PDF_FILENAME, PORTAL_CLIENT_SERVICE_AGREEMENT_PDF_FILENAME };

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const PROJECT_CREATION_NOTICE_HTML =
  '<p>We will create your project in the client portal within one business day. You will receive access to project updates, messaging, and document sharing once your project is ready.</p>';

const PROJECT_CREATION_NOTICE_TEXT =
  'We will create your project in the client portal within one business day. You will receive access to project updates, messaging, and document sharing once your project is ready.';

export function buildClientAgreementSignedEmail(options: {
  name: string;
  signerName: string;
  signedAtLabel: string;
  agreementTitle?: string;
  includeProjectCreationNotice?: boolean;
}) {
  const displayName = options.name.trim() || 'there';
  const signerName = options.signerName.trim();
  const signedAtLabel = options.signedAtLabel.trim();
  const agreementTitle = options.agreementTitle?.trim() || PORTAL_AGREEMENT_TITLE;

  const subject = 'Your signed Client Service Agreement — all9s Solutions';
  const projectCreationNoticeHtml = options.includeProjectCreationNotice
    ? PROJECT_CREATION_NOTICE_HTML
    : '';
  const projectCreationNoticeText = options.includeProjectCreationNotice
    ? ['', PROJECT_CREATION_NOTICE_TEXT]
    : [];

  const html = `<!DOCTYPE html>
<html>
<body style="font-family:Inter,Segoe UI,sans-serif;line-height:1.6;color:#111827;max-width:560px;margin:0 auto;padding:24px;">
  <p>Hi ${escapeHtml(displayName)},</p>
  <p>Thank you for signing the <strong>${escapeHtml(agreementTitle)}</strong>.</p>
  <p>all9s Solutions has received and saved your electronic signature. Your agreement is on file with us as of <strong>${escapeHtml(signedAtLabel)}</strong>, signed by <strong>${escapeHtml(signerName)}</strong>.</p>
  <p>A copy of the fully executed agreement is attached to this email for your records.</p>
  ${projectCreationNoticeHtml}
  <p style="font-size:14px;color:#6b7280;margin-top:32px;">If you have questions, reply to this email or contact us at <a href="mailto:hello@all9ssolutions.com">hello@all9ssolutions.com</a>.</p>
  <p style="font-size:14px;color:#6b7280;">— all9s Solutions</p>
</body>
</html>`;

  const text = [
    `Hi ${displayName},`,
    '',
    `Thank you for signing the ${agreementTitle}.`,
    '',
    'all9s Solutions has received and saved your electronic signature. Your agreement is on file with us as of',
    `${signedAtLabel}, signed by ${signerName}.`,
    '',
    'A copy of the fully executed agreement is attached to this email for your records.',
    ...projectCreationNoticeText,
    '',
    'Questions? Reply to this email or contact hello@all9ssolutions.com.',
    '',
    '— all9s Solutions',
  ].join('\n');

  return { subject, html, text };
}

export async function sendClientAgreementSignedEmail(options: {
  to: string;
  name: string;
  signerName: string;
  signedAtLabel: string;
  agreementTitle?: string;
  includeProjectCreationNotice?: boolean;
  pdfFilename?: string;
  pdf: Buffer;
}): Promise<{ ok: true } | { ok: false; error: string; skipped?: boolean }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.CONSULTATION_CONFIRMATION_FROM?.trim();

  if (!apiKey || !from) {
    return { ok: false, error: 'Email not configured', skipped: true };
  }

  const to = options.to.trim();
  if (!to) {
    return { ok: false, error: 'Recipient email is required' };
  }

  const { subject, html, text } = buildClientAgreementSignedEmail({
    name: options.name,
    signerName: options.signerName,
    signedAtLabel: options.signedAtLabel,
    agreementTitle: options.agreementTitle,
    includeProjectCreationNotice: options.includeProjectCreationNotice,
  });

  const pdfFilename = options.pdfFilename?.trim() || CLIENT_AGREEMENT_PDF_FILENAME;

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
      attachments: [
        {
          filename: pdfFilename,
          content: options.pdf.toString('base64'),
        },
      ],
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
      ok: false,
      error: typeof body.message === 'string' ? body.message : `Resend error (${res.status})`,
    };
  }

  return { ok: true };
}

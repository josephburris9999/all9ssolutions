function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildPortalTemporaryCredentialsEmail(options: {
  name: string;
  temporaryPassword: string;
  portalUrl: string;
  variant?: 'new' | 'reset';
}) {
  const displayName = options.name.trim() || 'there';
  const portalSignInUrl = `${options.portalUrl.replace(/\/$/, '')}/portal`;
  const isNewAccount = options.variant !== 'reset';
  const subject = 'Your all9s Solutions client portal access';
  const intro = isNewAccount
    ? 'Your <strong>all9s Solutions</strong> client portal account is ready. You can sign in using the temporary password below.'
    : 'Your <strong>all9s Solutions</strong> client portal account has been reset. You can sign in using the temporary password below.';
  const textIntro = isNewAccount
    ? 'Your all9s Solutions client portal account is ready. You can sign in with the temporary password below.'
    : 'Your all9s Solutions client portal account has been reset. You can sign in with the temporary password below.';

  const html = `<!DOCTYPE html>
<html>
<body style="font-family:Inter,Segoe UI,sans-serif;line-height:1.6;color:#111827;max-width:560px;margin:0 auto;padding:24px;">
  <p>Hi ${escapeHtml(displayName)},</p>
  <p>${intro}</p>
  <p style="margin:28px 0;">
    <a href="${escapeHtml(portalSignInUrl)}" style="display:inline-block;background:#7c3aed;color:#ffffff;padding:12px 24px;border-radius:9999px;text-decoration:none;font-weight:600;">Sign in to the portal</a>
  </p>
  <table style="width:100%;border-collapse:collapse;margin:24px 0;font-size:14px;">
    <tr><td style="padding:8px 0;color:#6b7280;">Portal</td><td style="padding:8px 0;"><a href="${escapeHtml(portalSignInUrl)}">${escapeHtml(portalSignInUrl)}</a></td></tr>
    <tr><td style="padding:8px 0;color:#6b7280;">Temporary password</td><td style="padding:8px 0;font-family:ui-monospace,monospace;">${escapeHtml(options.temporaryPassword)}</td></tr>
  </table>
  <p>When you next access the portal, you will be prompted to choose your own password before continuing.</p>
  <p style="font-size:14px;color:#6b7280;margin-top:32px;">If you did not expect this email or need help, contact us at <a href="mailto:hello@all9ssolutions.com">hello@all9ssolutions.com</a>.</p>
  <p style="font-size:14px;color:#6b7280;">— all9s Solutions</p>
</body>
</html>`;

  const text = [
    `Hi ${displayName},`,
    '',
    textIntro,
    '',
    `Portal: ${portalSignInUrl}`,
    `Temporary password: ${options.temporaryPassword}`,
    '',
    'When you next access the portal, you will be prompted to choose your own password before continuing.',
    '',
    'If you did not expect this email or need help, contact hello@all9ssolutions.com.',
    '',
    '— all9s Solutions',
  ].join('\n');

  return { subject, html, text };
}

export async function sendPortalTemporaryCredentialsEmail(options: {
  to: string;
  name: string;
  temporaryPassword: string;
  portalUrl: string;
  variant?: 'new' | 'reset';
}): Promise<{ ok: true } | { ok: false; error: string; skipped?: boolean }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.CONSULTATION_CONFIRMATION_FROM?.trim();

  if (!apiKey || !from) {
    return { ok: false, error: 'Email not configured', skipped: true };
  }

  const { subject, html, text } = buildPortalTemporaryCredentialsEmail(options);

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [options.to],
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
      ok: false,
      error: typeof body.message === 'string' ? body.message : `Resend error (${res.status})`,
    };
  }

  return { ok: true };
}

export function buildPortalPasswordResetEmail(resetUrl: string) {
  const subject = 'Reset your all9s Solutions client portal password';
  const html = `<!DOCTYPE html>
<html>
<body style="font-family:Inter,Segoe UI,sans-serif;line-height:1.6;color:#111827;max-width:560px;margin:0 auto;padding:24px;">
  <p>Hello,</p>
  <p>We received a request to reset the password for your <strong>all9s Solutions</strong> client portal account.</p>
  <p style="margin:28px 0;">
    <a href="${escapeHtml(resetUrl)}" style="display:inline-block;background:#7c3aed;color:#ffffff;padding:12px 24px;border-radius:9999px;text-decoration:none;font-weight:600;">Reset password</a>
  </p>
  <p style="font-size:14px;color:#6b7280;">Or copy this link into your browser:</p>
  <p style="font-size:14px;word-break:break-all;">${escapeHtml(resetUrl)}</p>
  <p style="font-size:14px;color:#6b7280;margin-top:32px;">This link expires in <strong>one hour</strong>. If you did not request a reset, you can ignore this email.</p>
  <p style="font-size:14px;color:#6b7280;">— all9s Solutions</p>
</body>
</html>`;

  const text = [
    'We received a request to reset your all9s Solutions client portal password.',
    '',
    `Reset your password: ${resetUrl}`,
    '',
    'This link expires in one hour. If you did not request a reset, ignore this email.',
    '',
    '— all9s Solutions',
  ].join('\n');

  return { subject, html, text };
}

export async function sendPortalPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<{ ok: true } | { ok: false; error: string; skipped?: boolean }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.CONSULTATION_CONFIRMATION_FROM?.trim();

  if (!apiKey || !from) {
    return { ok: false, error: 'Email not configured', skipped: true };
  }

  const { subject, html, text } = buildPortalPasswordResetEmail(resetUrl);

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
      ok: false,
      error: typeof body.message === 'string' ? body.message : `Resend error (${res.status})`,
    };
  }

  return { ok: true };
}

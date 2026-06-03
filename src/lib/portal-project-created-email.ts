function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildPortalProjectCreatedEmail(options: {
  name: string;
  projectTitle: string;
  portalUrl: string;
  projectId: string;
  temporaryPassword?: string | null;
}) {
  const displayName = options.name.trim() || 'there';
  const projectTitle = options.projectTitle.trim() || 'Your project';
  const portalBaseUrl = options.portalUrl.replace(/\/$/, '');
  const portalSignInUrl = `${portalBaseUrl}/portal`;
  const projectUrl = `${portalBaseUrl}/portal/dashboard?project=${encodeURIComponent(options.projectId)}`;
  const includeCredentials = Boolean(options.temporaryPassword?.trim());

  const subject = `Your project is ready — ${projectTitle}`;

  const credentialsHtml = includeCredentials
    ? `<p>Your client portal account is ready. Sign in with the temporary password below, then choose your own password when prompted.</p>
  <table style="width:100%;border-collapse:collapse;margin:24px 0;font-size:14px;">
    <tr><td style="padding:8px 0;color:#6b7280;">Portal</td><td style="padding:8px 0;"><a href="${escapeHtml(portalSignInUrl)}">${escapeHtml(portalSignInUrl)}</a></td></tr>
    <tr><td style="padding:8px 0;color:#6b7280;">Temporary password</td><td style="padding:8px 0;font-family:ui-monospace,monospace;">${escapeHtml(options.temporaryPassword!.trim())}</td></tr>
  </table>`
    : `<p>Sign in to your existing client portal account to view project updates, agreements, and shared documents.</p>`;

  const credentialsText = includeCredentials
    ? [
        'Your client portal account is ready. Sign in with the temporary password below, then choose your own password when prompted.',
        '',
        `Portal: ${portalSignInUrl}`,
        `Temporary password: ${options.temporaryPassword!.trim()}`,
      ]
    : ['Sign in to your existing client portal account to view project updates, agreements, and shared documents.'];

  const html = `<!DOCTYPE html>
<html>
<body style="font-family:Inter,Segoe UI,sans-serif;line-height:1.6;color:#111827;max-width:560px;margin:0 auto;padding:24px;">
  <p>Hi ${escapeHtml(displayName)},</p>
  <p>Your project <strong>${escapeHtml(projectTitle)}</strong> is now active in the <strong>all9s Solutions</strong> client portal.</p>
  ${credentialsHtml}
  <p style="margin:28px 0;">
    <a href="${escapeHtml(projectUrl)}" style="display:inline-block;background:#7c3aed;color:#ffffff;padding:12px 24px;border-radius:9999px;text-decoration:none;font-weight:600;">Open your project</a>
  </p>
  <p style="font-size:14px;color:#6b7280;">Or copy this link into your browser:</p>
  <p style="font-size:14px;word-break:break-all;">${escapeHtml(projectUrl)}</p>
  <p style="font-size:14px;color:#6b7280;margin-top:32px;">If you have questions, reply to this email or contact us at <a href="mailto:hello@all9ssolutions.com">hello@all9ssolutions.com</a>.</p>
  <p style="font-size:14px;color:#6b7280;">— all9s Solutions</p>
</body>
</html>`;

  const text = [
    `Hi ${displayName},`,
    '',
    `Your project "${projectTitle}" is now active in the all9s Solutions client portal.`,
    '',
    ...credentialsText,
    '',
    `Open your project: ${projectUrl}`,
    '',
    'Questions? Reply to this email or contact hello@all9ssolutions.com.',
    '',
    '— all9s Solutions',
  ].join('\n');

  return { subject, html, text };
}

export async function sendPortalProjectCreatedEmail(options: {
  to: string;
  name: string;
  projectTitle: string;
  portalUrl: string;
  projectId: string;
  temporaryPassword?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string; skipped?: boolean }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.CONSULTATION_CONFIRMATION_FROM?.trim();

  if (!apiKey || !from) {
    return { ok: false, error: 'Email not configured', skipped: true };
  }

  const { subject, html, text } = buildPortalProjectCreatedEmail(options);

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

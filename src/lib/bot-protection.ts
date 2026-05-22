const MIN_FORM_DURATION_MS = 3_000;
const MAX_FORM_DURATION_MS = 24 * 60 * 60 * 1000;

export type BotCheckInput = {
  website?: string;
  _formStartedAt?: number;
  turnstileToken?: string;
  userAgent?: string | null;
};

export type BotCheckResult =
  | { ok: true }
  | { ok: false; reason: string };

function turnstileEnvKeys(): { siteKey: string; secret: string } {
  return {
    siteKey: (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '').trim(),
    secret: (process.env.TURNSTILE_SECRET_KEY ?? '').trim(),
  };
}

export function isTurnstileEnabled(): boolean {
  const { siteKey, secret } = turnstileEnvKeys();
  return siteKey.length > 0 && secret.length > 0;
}

export function validateBotSignals(input: BotCheckInput): BotCheckResult {
  if (input.website && input.website.trim().length > 0) {
    return { ok: false, reason: 'Submission rejected' };
  }

  const startedAt = input._formStartedAt;
  if (!startedAt || !Number.isFinite(startedAt)) {
    return { ok: false, reason: 'Invalid submission' };
  }

  const elapsed = Date.now() - startedAt;
  if (elapsed < MIN_FORM_DURATION_MS) {
    return { ok: false, reason: 'Please take a moment before submitting' };
  }
  if (elapsed > MAX_FORM_DURATION_MS) {
    return { ok: false, reason: 'Form session expired. Please refresh and try again' };
  }

  const ua = input.userAgent?.trim() ?? '';
  if (ua.length === 0) {
    return { ok: false, reason: 'Submission rejected' };
  }

  if (isTurnstileEnabled() && !input.turnstileToken?.trim()) {
    return { ok: false, reason: 'Please complete the security check' };
  }

  return { ok: true };
}

export async function verifyTurnstileToken(
  token: string,
  remoteIp: string
): Promise<boolean> {
  const { secret } = turnstileEnvKeys();
  if (!secret) return true;

  const body = new URLSearchParams({
    secret,
    response: token,
    remoteip: remoteIp,
  });

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) return false;

  const data = (await res.json()) as { success?: boolean };
  return data.success === true;
}

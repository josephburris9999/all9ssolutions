import { NextResponse } from 'next/server';
import {
  validateBotSignals,
  verifyTurnstileToken,
} from '@/lib/bot-protection';
import {
  consultationFormSchema,
  consultationSubmitSchema,
} from '@/lib/consultation-schema';
import {
  checkRateLimit,
  formatRetryAfter,
  getClientIp,
  isConsultationRateLimitEnabled,
} from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

async function forwardToMailHandler(payload: Record<string, string>) {
  const forwardUrl = process.env.CONSULTATION_MAIL_FORWARD_URL;
  if (!forwardUrl) return { ok: true as const, skipped: true as const };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const apiSecret = process.env.CONSULTATION_API_SECRET;
  if (apiSecret) {
    headers['X-Consultation-Secret'] = apiSecret;
  }

  const res = await fetch(forwardUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  let body: { ok?: boolean; error?: string } = {};
  try {
    body = (await res.json()) as typeof body;
  } catch {
    // ignore
  }

  if (!res.ok || !body.ok) {
    return {
      ok: false as const,
      error: typeof body.error === 'string' ? body.error : 'Mail delivery failed',
    };
  }

  return { ok: true as const, skipped: false as const };
}

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);

  if (isConsultationRateLimitEnabled()) {
    const burst = checkRateLimit(`consultation:burst:${ip}`, 5, 15 * 60 * 1000);
    if (!burst.allowed) {
      const retry = formatRetryAfter(burst.retryAfterSeconds);
      return NextResponse.json(
        {
          ok: false,
          error: `Too many requests. Please try again in ${retry}.`,
          retryAfterSeconds: burst.retryAfterSeconds,
        },
        { status: 429, headers: { 'Retry-After': String(burst.retryAfterSeconds) } }
      );
    }

    const daily = checkRateLimit(`consultation:daily:${ip}`, 20, 24 * 60 * 60 * 1000);
    if (!daily.allowed) {
      const retry = formatRetryAfter(daily.retryAfterSeconds);
      return NextResponse.json(
        {
          ok: false,
          error: `Daily submission limit reached. Please try again in ${retry}.`,
          retryAfterSeconds: daily.retryAfterSeconds,
        },
        { status: 429, headers: { 'Retry-After': String(daily.retryAfterSeconds) } }
      );
    }
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = consultationSubmitSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid submission' },
      { status: 400 }
    );
  }

  const { website, _formStartedAt, turnstileToken, ...formValues } = parsed.data;

  const botCheck = validateBotSignals({
    website,
    _formStartedAt,
    turnstileToken,
    userAgent: request.headers.get('user-agent'),
  });
  if (!botCheck.ok) {
    return NextResponse.json({ ok: false, error: botCheck.reason }, { status: 400 });
  }

  if (turnstileToken) {
    const valid = await verifyTurnstileToken(turnstileToken, ip);
    if (!valid) {
      return NextResponse.json(
        { ok: false, error: 'Security verification failed. Please try again.' },
        { status: 400 }
      );
    }
  }

  const formParsed = consultationFormSchema.safeParse(formValues);
  if (!formParsed.success) {
    return NextResponse.json(
      { ok: false, error: formParsed.error.issues[0]?.message ?? 'Invalid submission' },
      { status: 400 }
    );
  }

  const data = formParsed.data;

  try {
    await prisma.consultationRequest.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        timezone: data.timezone || null,
        preferredContact: data.preferredContact,
        company: data.company || null,
        message: data.message,
      },
    });
  } catch (err) {
    console.error('Failed to save consultation request:', err);
    return NextResponse.json(
      { ok: false, error: 'Could not save your request. Please try again later.' },
      { status: 500 }
    );
  }

  const mail = await forwardToMailHandler({
    name: data.name,
    email: data.email,
    phone: data.phone,
    timezone: data.timezone,
    preferredContact: data.preferredContact,
    company: data.company,
    message: data.message,
  });

  if (!mail.ok) {
    console.error('Consultation saved but mail forward failed:', mail.error);
  }

  return NextResponse.json({ ok: true });
}

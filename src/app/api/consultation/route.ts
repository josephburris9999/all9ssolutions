import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
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
import {
  sendConsultationAdminEmail,
  sendConsultationConfirmationEmail,
} from '@/lib/consultation-email';
import { saveConsultationConfirmationResendEmailId } from '@/lib/consultation-email-delivery';
import { findLinkedPortalUserIdByConsultationEmail } from '@/lib/portal-user';

export const runtime = 'nodejs';

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

  let consultationRequestId: string;

  try {
    const portalUserId = await findLinkedPortalUserIdByConsultationEmail(data.email);

    const consultation = await prisma.consultationRequest.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        timezone: data.timezone || null,
        preferredContact: data.preferredContact,
        company: data.company || null,
        message: data.message,
        ...(portalUserId ? { portalUserId } : {}),
      },
      select: { id: true },
    });
    consultationRequestId = consultation.id;
  } catch (err) {
    console.error('Failed to save consultation request:', err);
    return NextResponse.json(
      { ok: false, error: 'Could not save your request. Please try again later.' },
      { status: 500 }
    );
  }

  const confirmation = await sendConsultationConfirmationEmail({
    name: data.name,
    email: data.email,
    phone: data.phone,
    timezone: data.timezone,
    preferredContact: data.preferredContact,
    company: data.company,
    message: data.message,
  });

  if (!confirmation.ok) {
    if (confirmation.skipped) {
      console.warn('Consultation confirmation email skipped (RESEND_API_KEY or CONSULTATION_CONFIRMATION_FROM not set)');
    } else {
      console.error('Consultation saved but confirmation email failed:', confirmation.error);
    }
  } else {
    try {
      await saveConsultationConfirmationResendEmailId(consultationRequestId, confirmation.resendEmailId);
    } catch (err) {
      console.error('Consultation saved but failed to store Resend email id:', err);
    }
  }

  const adminNotification = await sendConsultationAdminEmail({
    name: data.name,
    email: data.email,
    phone: data.phone,
    timezone: data.timezone,
    preferredContact: data.preferredContact,
    company: data.company,
    message: data.message,
  });

  if (!adminNotification.ok) {
    if (adminNotification.skipped) {
      console.warn('Consultation admin email skipped:', adminNotification.error);
    } else {
      console.error('Consultation saved but admin email failed:', adminNotification.error);
    }
  }

  revalidatePath('/portal/admin', 'layout');

  return NextResponse.json({ ok: true });
}

import { NextResponse } from 'next/server';
import { getPortalSession } from '@/lib/portal-auth';
import {
  buildPortalAgreementStatus,
  formatPortalSignedAt,
  PORTAL_AGREEMENT_VERSION,
} from '@/lib/portal-agreement';
import { buildPortalAgreementPdfForClient } from '@/lib/portal-agreement-document';
import { portalAgreementSignSchema } from '@/lib/portal-agreement-schema';
import { sendClientAgreementSignedEmail } from '@/lib/portal-agreement-signed-email';
import {
  getClientAgreementByConsultationRequestId,
  hasClientAgreementForConsultation,
  portalUserOwnsConsultationRequest,
  signClientAgreementForConsultation,
} from '@/lib/client-agreement-store';
import { getPortalClientProfile } from '@/lib/portal-user';
import {
  checkRateLimit,
  formatRetryAfter,
  getClientIp,
  isPortalRateLimitEnabled,
} from '@/lib/rate-limit';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await getPortalSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'You must be signed in' }, { status: 401 });
  }

  const { id: consultationRequestId } = await context.params;

  if (!(await portalUserOwnsConsultationRequest(session.userId, consultationRequestId))) {
    return NextResponse.json({ ok: false, error: 'Consultation not found' }, { status: 404 });
  }

  const agreement = await getClientAgreementByConsultationRequestId(consultationRequestId);

  return NextResponse.json({
    ok: true,
    agreement: buildPortalAgreementStatus(agreement),
  });
}

export async function POST(request: Request, context: RouteContext) {
  const session = await getPortalSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'You must be signed in' }, { status: 401 });
  }

  const { id: consultationRequestId } = await context.params;

  if (!(await portalUserOwnsConsultationRequest(session.userId, consultationRequestId))) {
    return NextResponse.json({ ok: false, error: 'Consultation not found' }, { status: 404 });
  }

  const ip = getClientIp(request.headers);
  if (isPortalRateLimitEnabled()) {
    const burst = checkRateLimit(
      `portal-consultation-agreement:${session.userId}:${consultationRequestId}:${ip}`,
      10,
      15 * 60 * 1000
    );
    if (!burst.allowed) {
      const retry = formatRetryAfter(burst.retryAfterSeconds);
      return NextResponse.json(
        { ok: false, error: `Too many attempts. Please try again in ${retry}.` },
        { status: 429, headers: { 'Retry-After': String(burst.retryAfterSeconds) } }
      );
    }
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = portalAgreementSignSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Invalid signature';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }

  if (await hasClientAgreementForConsultation(consultationRequestId)) {
    return NextResponse.json(
      { ok: false, error: 'This agreement has already been signed and cannot be signed again.' },
      { status: 409 }
    );
  }

  const signedAt = new Date(parsed.data.signedAt);
  const signedTimeZone = parsed.data.clientTimeZone?.trim() || null;

  const agreement = await signClientAgreementForConsultation(consultationRequestId, {
    signerName: parsed.data.signerName,
    signedAt,
    version: PORTAL_AGREEMENT_VERSION,
    signedTimeZone,
  });

  const agreementStatus = buildPortalAgreementStatus(agreement);
  const displayTimeZone = signedTimeZone?.trim() || 'UTC';
  const signedAtLabel = agreementStatus.signedAt
    ? formatPortalSignedAt(agreementStatus.signedAt, displayTimeZone)
    : formatPortalSignedAt(signedAt.toISOString(), displayTimeZone);

  try {
    const clientProfile = await getPortalClientProfile(session.userId, session.email);
    const pdf = await buildPortalAgreementPdfForClient({
      clientProfile,
      consultationRequestId,
      timeZone: displayTimeZone,
    });

    const emailResult = await sendClientAgreementSignedEmail({
      to: clientProfile.email,
      name: clientProfile.name,
      signerName: agreement.signerName,
      signedAtLabel,
      includeProjectCreationNotice: true,
      pdf,
    });

    if (!emailResult.ok && !emailResult.skipped) {
      console.error('[portal/consultation-requests/agreement] signed confirmation email failed:', emailResult.error);
    }
  } catch (error) {
    console.error(
      '[portal/consultation-requests/agreement] signed confirmation email error:',
      error instanceof Error ? error.message : error
    );
  }

  return NextResponse.json({
    ok: true,
    agreement: agreementStatus,
  });
}

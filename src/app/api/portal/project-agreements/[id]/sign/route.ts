import { NextResponse } from 'next/server';
import { formatPortalSignedAt } from '@/lib/portal-agreement';
import { agreementPdfDownloadFilename } from '@/lib/portal-agreement-filename';
import { buildProjectAgreementPdfForClient } from '@/lib/portal-agreement-document';
import { portalAgreementSignSchema } from '@/lib/portal-agreement-schema';
import { sendClientAgreementSignedEmail } from '@/lib/portal-agreement-signed-email';
import { getPortalSession } from '@/lib/portal-auth';
import {
  getProjectAgreementForPortalUser,
  signProjectAgreementForUser,
} from '@/lib/project-agreement-store';
import { prisma } from '@/lib/prisma';
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

export async function POST(request: Request, context: RouteContext) {
  const session = await getPortalSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'You must be signed in' }, { status: 401 });
  }

  const { id } = await context.params;

  const ip = getClientIp(request.headers);
  if (isPortalRateLimitEnabled()) {
    const burst = checkRateLimit(`portal-project-agreement:${session.userId}:${ip}`, 10, 15 * 60 * 1000);
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

  const user = await prisma.portalUser.findUnique({
    where: { id: session.userId },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ ok: false, error: 'Account not found' }, { status: 404 });
  }

  const existing = await getProjectAgreementForPortalUser(id, session.userId);
  if (!existing) {
    return NextResponse.json({ ok: false, error: 'Agreement not found' }, { status: 404 });
  }

  if (existing.status.signed) {
    return NextResponse.json(
      { ok: false, error: 'This agreement has already been signed and cannot be signed again.' },
      { status: 409 }
    );
  }

  const signedAt = new Date(parsed.data.signedAt);
  const signedTimeZone = parsed.data.clientTimeZone?.trim() || null;

  let signed;
  try {
    signed = await signProjectAgreementForUser(id, session.userId, {
      signerName: parsed.data.signerName,
      signedAt,
      signedTimeZone,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'ALREADY_SIGNED') {
      return NextResponse.json(
        { ok: false, error: 'This agreement has already been signed and cannot be signed again.' },
        { status: 409 }
      );
    }
    throw error;
  }

  if (!signed) {
    return NextResponse.json({ ok: false, error: 'Agreement not found' }, { status: 404 });
  }

  const displayTimeZone = signedTimeZone?.trim() || 'UTC';
  const signedAtLabel = signed.status.signedAt
    ? formatPortalSignedAt(signed.status.signedAt, displayTimeZone)
    : formatPortalSignedAt(signedAt.toISOString(), displayTimeZone);

  try {
    const clientProfile = await getPortalClientProfile(session.userId, session.email);
    const pdf = await buildProjectAgreementPdfForClient({
      clientProfile,
      projectAgreementId: id,
      portalUserId: session.userId,
      timeZone: displayTimeZone,
    });

    const emailResult = await sendClientAgreementSignedEmail({
      to: clientProfile.email,
      name: clientProfile.name,
      signerName: parsed.data.signerName,
      signedAtLabel,
      agreementTitle: signed.title,
      pdfFilename: agreementPdfDownloadFilename(signed.title),
      pdf,
    });

    if (!emailResult.ok && !emailResult.skipped) {
      console.error('[portal/project-agreements/sign] signed confirmation email failed:', emailResult.error);
    }
  } catch (error) {
    console.error(
      '[portal/project-agreements/sign] signed confirmation email error:',
      error instanceof Error ? error.message : error
    );
  }

  return NextResponse.json({
    ok: true,
    agreementId: signed.id,
    agreement: signed.status,
  });
}

import { NextResponse } from 'next/server';
import { FORGOT_PASSWORD_SUCCESS_MESSAGE, portalForgotPasswordSchema } from '@/lib/portal-forgot-password-schema';
import {
  buildPasswordResetUrl,
  createPasswordResetToken,
  getPasswordResetExpiry,
  hashPasswordResetToken,
} from '@/lib/portal-password-reset';
import { sendPortalPasswordResetEmail } from '@/lib/portal-reset-email';
import { normalizePortalEmail, findPortalUserByConsultationEmail } from '@/lib/portal-user';
import { prisma } from '@/lib/prisma';
import {
  checkRateLimit,
  formatRetryAfter,
  getClientIp,
  isPortalRateLimitEnabled,
} from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);

  if (isPortalRateLimitEnabled()) {
    const burst = checkRateLimit(`portal-forgot:${ip}`, 5, 15 * 60 * 1000);
    if (!burst.allowed) {
      const retry = formatRetryAfter(burst.retryAfterSeconds);
      return NextResponse.json(
        { ok: false, error: `Too many requests. Please try again in ${retry}.` },
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

  const parsed = portalForgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Invalid email';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }

  const email = normalizePortalEmail(parsed.data.email);

  try {
    const user = await findPortalUserByConsultationEmail(email);

    if (user) {
      const token = createPasswordResetToken();
      const tokenHash = hashPasswordResetToken(token);
      const expiresAt = getPasswordResetExpiry();

      await prisma.portalUser.update({
        where: { id: user.id },
        data: {
          passwordResetTokenHash: tokenHash,
          passwordResetExpiresAt: expiresAt,
        },
      });

      const resetUrl = buildPasswordResetUrl(request, token);
      const mail = await sendPortalPasswordResetEmail(email, resetUrl);

      if (!mail.ok && !mail.skipped) {
        console.error('Password reset email failed:', mail.error);
      }
    }
  } catch (error) {
    console.error('Forgot password failed:', error);
  }

  return NextResponse.json({
    ok: true,
    message: FORGOT_PASSWORD_SUCCESS_MESSAGE,
  });
}

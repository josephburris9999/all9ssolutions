import { NextResponse } from 'next/server';
import { hashPassword } from '@/lib/password';
import {
  hashPasswordResetToken,
  isPasswordResetTokenValid,
} from '@/lib/portal-password-reset';
import { portalResetPasswordSchema } from '@/lib/portal-reset-password-schema';
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
    const burst = checkRateLimit(`portal-reset:${ip}`, 10, 15 * 60 * 1000);
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

  const parsed = portalResetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Invalid submission';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }

  const tokenHash = hashPasswordResetToken(parsed.data.token);

  const user = await prisma.portalUser.findFirst({
    where: {
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { gt: new Date() },
    },
  });

  if (!user || !isPasswordResetTokenValid(user.passwordResetExpiresAt)) {
    return NextResponse.json(
      { ok: false, error: 'This reset link is invalid or has expired. Request a new one.' },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);

  await prisma.portalUser.update({
    where: { id: user.id },
    data: {
      passwordHash,
      mustChangePassword: false,
      failedLoginAttempts: 0,
      lockedAt: null,
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
    },
  });

  return NextResponse.json({ ok: true });
}

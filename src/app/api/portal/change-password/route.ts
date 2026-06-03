import { NextResponse } from 'next/server';
import { createSessionCookieForUser, getPortalSession } from '@/lib/portal-auth';
import { portalChangePasswordSchema } from '@/lib/portal-change-password-schema';
import { getPortalHomePath } from '@/lib/portal-role-data';
import { hashPassword } from '@/lib/password';
import { prisma } from '@/lib/prisma';
import {
  checkRateLimit,
  formatRetryAfter,
  getClientIp,
  isPortalRateLimitEnabled,
} from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const session = await getPortalSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'You must be signed in' }, { status: 401 });
  }

  const ip = getClientIp(request.headers);
  if (isPortalRateLimitEnabled()) {
    const burst = checkRateLimit(`portal-password:${session.userId}:${ip}`, 5, 15 * 60 * 1000);
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

  const parsed = portalChangePasswordSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Invalid password';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }

  const user = await prisma.portalUser.findUnique({ where: { id: session.userId } });
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Account not found' }, { status: 404 });
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  const updated = await prisma.portalUser.update({
    where: { id: user.id },
    data: {
      passwordHash,
      mustChangePassword: false,
      failedLoginAttempts: 0,
      lockedAt: null,
    },
  });

  const sessionCookie = createSessionCookieForUser({
    id: updated.id,
    email: session.email,
    role: updated.role,
    mustChangePassword: updated.mustChangePassword,
  });

  const response = NextResponse.json({
    ok: true,
    mustChangePassword: false,
    redirectTo: getPortalHomePath(updated.role),
  });
  response.cookies.set(sessionCookie.name, sessionCookie.value, {
    httpOnly: sessionCookie.httpOnly,
    secure: sessionCookie.secure,
    sameSite: sessionCookie.sameSite,
    path: sessionCookie.path,
    maxAge: sessionCookie.maxAge,
  });

  return response;
}

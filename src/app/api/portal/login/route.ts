import { NextResponse } from 'next/server';
import { createSessionCookieForUser } from '@/lib/portal-auth';
import {
  GENERIC_LOGIN_ERROR,
  LOCKED_ACCOUNT_ERROR,
  recordFailedPortalLogin,
  resetPortalLoginAttempts,
} from '@/lib/portal-login-lock';
import { portalLoginSchema } from '@/lib/portal-login-schema';
import { normalizePortalEmail, findPortalUserByConsultationEmail } from '@/lib/portal-user';
import { getPortalHomePath, isPortalAdminRole } from '@/lib/portal-role-data';
import { clientHasActivePortalProject } from '@/lib/portal-projects';
import { CLIENT_PORTAL_NO_ACTIVE_PROJECT_MESSAGE } from '@/lib/portal-client-access';
import { verifyPassword } from '@/lib/password';
import {
  checkRateLimit,
  formatRetryAfter,
  getClientIp,
  isPortalRateLimitEnabled,
} from '@/lib/rate-limit';

export const runtime = 'nodejs';

function portalLoginError(message: string, status: number) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);

  if (isPortalRateLimitEnabled()) {
    const burst = checkRateLimit(`portal-login:burst:${ip}`, 10, 15 * 60 * 1000);
    if (!burst.allowed) {
      const retry = formatRetryAfter(burst.retryAfterSeconds);
      return portalLoginError(`Too many sign-in attempts. Please try again in ${retry}.`, 429);
    }
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return portalLoginError('Invalid request body', 400);
  }

  const parsed = portalLoginSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? GENERIC_LOGIN_ERROR;
    return portalLoginError(message, 400);
  }

  const email = normalizePortalEmail(parsed.data.email);

  try {
    const user = await findPortalUserByConsultationEmail(email);

    if (!user) {
      return portalLoginError(GENERIC_LOGIN_ERROR, 401);
    }

    const passwordValid = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!passwordValid) {
      const locked = await recordFailedPortalLogin(user.id);
      if (locked) {
        return portalLoginError(LOCKED_ACCOUNT_ERROR, 403);
      }
      return portalLoginError(GENERIC_LOGIN_ERROR, 401);
    }

    await resetPortalLoginAttempts(user.id);

    if (!isPortalAdminRole(user.role) && !(await clientHasActivePortalProject(user.id))) {
      return portalLoginError(CLIENT_PORTAL_NO_ACTIVE_PROJECT_MESSAGE, 403);
    }

    const sessionCookie = createSessionCookieForUser({
      id: user.id,
      email,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    });

    const response = NextResponse.json({
      ok: true,
      mustChangePassword: user.mustChangePassword,
      email,
      role: user.role,
      redirectTo: getPortalHomePath(user.role),
    });

    response.cookies.set(sessionCookie.name, sessionCookie.value, {
      httpOnly: sessionCookie.httpOnly,
      secure: sessionCookie.secure,
      sameSite: sessionCookie.sameSite,
      path: sessionCookie.path,
      maxAge: sessionCookie.maxAge,
    });

    return response;
  } catch (error) {
    console.error('Portal login failed:', error);
    return portalLoginError('Unable to sign in right now. Please try again later.', 500);
  }
}

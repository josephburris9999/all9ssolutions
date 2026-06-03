import { cookies } from 'next/headers';
import {
  createPortalSessionToken,
  getPortalSessionSecret,
  parsePortalSessionToken,
  PORTAL_SESSION_COOKIE,
  PORTAL_SESSION_MAX_AGE_SECONDS,
  type PortalSessionData,
} from '@/lib/portal-session';

export async function getPortalSession(): Promise<PortalSessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(PORTAL_SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    return parsePortalSessionToken(token, getPortalSessionSecret());
  } catch {
    return null;
  }
}

export function buildPortalSessionCookie(token: string) {
  return {
    name: PORTAL_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: PORTAL_SESSION_MAX_AGE_SECONDS,
  };
}

export function clearPortalSessionCookie() {
  return {
    name: PORTAL_SESSION_COOKIE,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
  };
}

export async function clearPortalSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(PORTAL_SESSION_COOKIE);
}

export function createSessionCookieForUser(user: {
  id: string;
  email: string;
  role: string;
  mustChangePassword: boolean;
}) {
  const token = createPortalSessionToken(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    },
    getPortalSessionSecret()
  );
  return buildPortalSessionCookie(token);
}

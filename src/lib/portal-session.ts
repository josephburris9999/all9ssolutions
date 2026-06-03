import { createHmac, timingSafeEqual } from 'crypto';
import { normalizePortalRole } from '@/lib/portal-role-data';

export const PORTAL_SESSION_COOKIE = 'portal_session';
const SESSION_VERSION = 1;
const DEFAULT_MAX_AGE_SECONDS = 60 * 60 * 8;

export type PortalSessionData = {
  v: number;
  userId: string;
  email: string;
  role: string;
  mustChangePassword: boolean;
  exp: number;
};

export function getPortalSessionSecret(): string {
  const secret = (process.env.PORTAL_SESSION_SECRET ?? '').trim();
  if (secret.length >= 32) return secret;
  if (process.env.NODE_ENV === 'development') {
    return 'dev-portal-session-secret-min-32-chars!!';
  }
  throw new Error('PORTAL_SESSION_SECRET must be at least 32 characters in production');
}

export function createPortalSessionToken(
  data: Pick<PortalSessionData, 'userId' | 'email' | 'role' | 'mustChangePassword'>,
  secret: string,
  maxAgeSeconds = DEFAULT_MAX_AGE_SECONDS
): string {
  const payload: PortalSessionData = {
    v: SESSION_VERSION,
    ...data,
    role: normalizePortalRole(data.role),
    exp: Math.floor(Date.now() / 1000) + maxAgeSeconds,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', secret).update(payloadB64).digest('base64url');
  return `${payloadB64}.${signature}`;
}

export function parsePortalSessionToken(token: string, secret: string): PortalSessionData | null {
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;

  const payloadB64 = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  const expected = createHmac('sha256', secret).update(payloadB64).digest('base64url');

  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const data = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as PortalSessionData;
    if (data.v !== SESSION_VERSION) return null;
    if (typeof data.userId !== 'string' || typeof data.email !== 'string') return null;
    if (typeof data.mustChangePassword !== 'boolean') return null;
    if (data.exp < Math.floor(Date.now() / 1000)) return null;
    return {
      ...data,
      role: normalizePortalRole(data.role),
    };
  } catch {
    return null;
  }
}

export const PORTAL_SESSION_MAX_AGE_SECONDS = DEFAULT_MAX_AGE_SECONDS;

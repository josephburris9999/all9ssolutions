import { createHash, randomBytes } from 'crypto';

export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

export function createPasswordResetToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashPasswordResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function getPasswordResetExpiry(): Date {
  return new Date(Date.now() + PASSWORD_RESET_TTL_MS);
}

export function isPasswordResetTokenValid(expiresAt: Date | null): boolean {
  if (!expiresAt) return false;
  return expiresAt.getTime() > Date.now();
}

export function getPortalAppUrl(request?: Request): string {
  const fromEnv = process.env.PORTAL_APP_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  const origin = request?.headers.get('origin')?.trim();
  if (origin) return origin;

  return 'http://localhost:9002';
}

export function buildPasswordResetUrl(request: Request | undefined, token: string): string {
  const base = getPortalAppUrl(request);
  const params = new URLSearchParams({ token });
  return `${base}/portal/reset-password?${params.toString()}`;
}

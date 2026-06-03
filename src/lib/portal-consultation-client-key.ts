import { normalizePortalEmail } from '@/lib/portal-user';

const EMAIL_KEY_PREFIX = 'e-';

export function buildConsultationClientKey(options: {
  portalUserId: string | null;
  email: string;
}): string {
  if (options.portalUserId) {
    return options.portalUserId;
  }

  const normalized = normalizePortalEmail(options.email);
  return `${EMAIL_KEY_PREFIX}${Buffer.from(normalized, 'utf8').toString('base64url')}`;
}

export function parseConsultationClientKey(
  clientKey: string
): { portalUserId: string } | { email: string } {
  if (clientKey.startsWith(EMAIL_KEY_PREFIX)) {
    const email = Buffer.from(clientKey.slice(EMAIL_KEY_PREFIX.length), 'base64url').toString('utf8');
    return { email: normalizePortalEmail(email) };
  }

  return { portalUserId: clientKey };
}

export function getPortalAdminConsultationClientPath(clientKey: string): string {
  return `/portal/admin/clients/consultations/${encodeURIComponent(clientKey)}`;
}

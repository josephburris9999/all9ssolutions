export const PORTAL_PATH = '/portal';

/** Existing ConsultationRequest email → client portal sign-in (no confirmation email). */
export function buildExistingClientPortalRedirect(email: string): string {
  const params = new URLSearchParams({ email: email.trim() });
  return `${PORTAL_PATH}?${params.toString()}#sign-in`;
}

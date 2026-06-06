/**
 * Display name for signed-in admin portal users.
 * Admins have no separate profile name — use login email, not client consultation data.
 */
export function getPortalAdminDisplayName(email: string): string {
  const trimmed = email.trim();
  return trimmed.length > 0 ? trimmed : 'Admin';
}

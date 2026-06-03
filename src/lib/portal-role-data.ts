export const PORTAL_ROLE_CLIENT = 'c';
export const PORTAL_ROLE_ADMIN = 'a';

export type PortalRole = typeof PORTAL_ROLE_CLIENT | typeof PORTAL_ROLE_ADMIN;

export function normalizePortalRole(role: string | null | undefined): PortalRole {
  return role === PORTAL_ROLE_ADMIN ? PORTAL_ROLE_ADMIN : PORTAL_ROLE_CLIENT;
}

export function isPortalAdminRole(role: string | null | undefined): boolean {
  return normalizePortalRole(role) === PORTAL_ROLE_ADMIN;
}

export function getPortalHomePath(role: string | null | undefined): '/portal/admin' | '/portal/dashboard' {
  return isPortalAdminRole(role) ? '/portal/admin' : '/portal/dashboard';
}

export const PORTAL_ADMIN_PATH = '/portal/admin';
export const PORTAL_CLIENT_DASHBOARD_PATH = '/portal/dashboard';

export const PORTAL_SIGNED_IN_PATHS = [PORTAL_CLIENT_DASHBOARD_PATH, PORTAL_ADMIN_PATH] as const;

export function portalProjectDashboardHref(basePath: string, projectId: string): string {
  const separator = basePath.includes('?') ? '&' : '?';
  return `${basePath}${separator}project=${encodeURIComponent(projectId)}`;
}

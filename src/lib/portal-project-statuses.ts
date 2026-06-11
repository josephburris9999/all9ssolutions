/** In-progress project statuses shared by admin lists, client portal access, and messaging. */
export const PORTAL_ACTIVE_PROJECT_STATUSES = ['PLANNED', 'ACTIVE', 'ON_HOLD'] as const;

export type PortalActiveProjectStatus = (typeof PORTAL_ACTIVE_PROJECT_STATUSES)[number];

export const PORTAL_COMPLETED_PROJECT_STATUS = 'COMPLETED' as const;

/** Admin selectable projects include completed records; client portal uses active only. */
export const PORTAL_SELECTABLE_PROJECT_STATUSES = [
  ...PORTAL_ACTIVE_PROJECT_STATUSES,
  PORTAL_COMPLETED_PROJECT_STATUS,
] as const;

export type PortalSelectableProjectStatus = (typeof PORTAL_SELECTABLE_PROJECT_STATUSES)[number];

export function isPortalActiveProjectStatus(status: string): status is PortalActiveProjectStatus {
  return (PORTAL_ACTIVE_PROJECT_STATUSES as readonly string[]).includes(status);
}

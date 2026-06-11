import { describe, expect, it } from 'vitest';
import {
  isPortalActiveProjectStatus,
  PORTAL_ACTIVE_PROJECT_STATUSES,
  PORTAL_COMPLETED_PROJECT_STATUS,
  PORTAL_SELECTABLE_PROJECT_STATUSES,
} from './portal-project-statuses';

describe('portal-project-statuses', () => {
  it('includes completed in selectable but not active statuses', () => {
    expect(PORTAL_SELECTABLE_PROJECT_STATUSES).toContain(PORTAL_COMPLETED_PROJECT_STATUS);
    expect(PORTAL_ACTIVE_PROJECT_STATUSES).not.toContain(PORTAL_COMPLETED_PROJECT_STATUS);
  });

  it('identifies active project statuses', () => {
    expect(isPortalActiveProjectStatus('ACTIVE')).toBe(true);
    expect(isPortalActiveProjectStatus('ON_HOLD')).toBe(true);
    expect(isPortalActiveProjectStatus('COMPLETED')).toBe(false);
    expect(isPortalActiveProjectStatus('UNKNOWN')).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import { buildPortalAdminMessagesSectionHref } from './portal-admin-unread-messages';

describe('buildPortalAdminMessagesSectionHref', () => {
  it('links active projects to the current list workspace messages section', () => {
    expect(
      buildPortalAdminMessagesSectionHref({
        consultationRequestId: 'consult-1',
        projectId: 'project-1',
        projectStatus: 'ACTIVE',
      })
    ).toBe('/portal/admin/clients/current?client=consult-1&project=project-1#portal-messages');
  });

  it('links completed projects to the completed list workspace messages section', () => {
    expect(
      buildPortalAdminMessagesSectionHref({
        consultationRequestId: 'consult-2',
        projectId: 'project-2',
        projectStatus: 'COMPLETED',
      })
    ).toBe('/portal/admin/clients/completed?client=consult-2&project=project-2#portal-messages');
  });

  it('falls back to completed workspace for non-active statuses', () => {
    expect(
      buildPortalAdminMessagesSectionHref({
        consultationRequestId: 'consult-3',
        projectId: 'project-3',
        projectStatus: 'CANCELLED',
      })
    ).toBe('/portal/admin/clients/completed?client=consult-3&project=project-3#portal-messages');
  });
});

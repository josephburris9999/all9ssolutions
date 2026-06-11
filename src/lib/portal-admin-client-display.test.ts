import { describe, expect, it } from 'vitest';
import {
  getPortalAdminCompletedClientsPageHref,
  getPortalAdminCurrentClientsPageHref,
} from './portal-admin-client-display';

describe('getPortalAdminCurrentClientsPageHref', () => {
  it('builds the inline current workspace url', () => {
    expect(getPortalAdminCurrentClientsPageHref('consult-1')).toBe(
      '/portal/admin/clients/current?client=consult-1'
    );
  });

  it('includes an optional project id', () => {
    expect(getPortalAdminCurrentClientsPageHref('consult-1', 'project-1')).toBe(
      '/portal/admin/clients/current?client=consult-1&project=project-1'
    );
  });
});

describe('getPortalAdminCompletedClientsPageHref', () => {
  it('builds the inline completed workspace url', () => {
    expect(getPortalAdminCompletedClientsPageHref('consult-2', 'project-2')).toBe(
      '/portal/admin/clients/completed?client=consult-2&project=project-2'
    );
  });
});

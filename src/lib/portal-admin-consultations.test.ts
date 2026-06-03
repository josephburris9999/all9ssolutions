import { describe, expect, it } from 'vitest';
import {
  isPortalAdminConsultationClient,
  isPortalAdminConsultationRequest,
  isPortalAdminCurrentClient,
  isPortalAdminCompletedClient,
} from './portal-admin-consultations';

describe('isPortalAdminConsultationRequest', () => {
  const portalUserIdsWithAdminRole = new Set(['user_admin']);
  const emailsWithAdminPortalUsers = new Set(['admin@example.com']);

  const baseOptions = {
    portalUserIdsWithAdminRole,
    emailsWithAdminPortalUsers,
    linkedPortalUserRole: null,
    portalUserId: null,
  };

  it('includes requests with no linked project', () => {
    expect(
      isPortalAdminConsultationRequest({
        ...baseOptions,
        email: 'new@example.com',
        hasLinkedProject: false,
      })
    ).toBe(true);
  });

  it('excludes requests that already have a project', () => {
    expect(
      isPortalAdminConsultationRequest({
        ...baseOptions,
        email: 'new@example.com',
        hasLinkedProject: true,
      })
    ).toBe(false);
  });

  it('includes requests even when the same email has projects on other requests', () => {
    expect(
      isPortalAdminConsultationRequest({
        ...baseOptions,
        email: 'active@example.com',
        hasLinkedProject: false,
      })
    ).toBe(true);
  });

  it('excludes admin portal users', () => {
    expect(
      isPortalAdminConsultationRequest({
        ...baseOptions,
        email: 'admin@example.com',
        portalUserId: 'user_admin',
        linkedPortalUserRole: 'a',
        hasLinkedProject: false,
      })
    ).toBe(false);
  });
});

describe('isPortalAdminConsultationClient', () => {
  const portalUserIdsWithActiveProjects = new Set(['user_active']);
  const emailsWithActiveProjects = new Set(['active@example.com']);
  const portalUserIdsWithAdminRole = new Set(['user_admin']);
  const emailsWithAdminPortalUsers = new Set(['admin@example.com']);

  const baseOptions = {
    hasActiveLinkedProject: false,
    portalUserIdsWithActiveProjects,
    emailsWithActiveProjects,
    portalUserIdsWithAdminRole,
    emailsWithAdminPortalUsers,
    linkedPortalUserRole: null,
  };

  it('includes consultations without an active linked project or active client record', () => {
    expect(
      isPortalAdminConsultationClient({
        ...baseOptions,
        email: 'new@example.com',
        portalUserId: null,
      })
    ).toBe(true);
  });

  it('excludes consultations linked to an active project', () => {
    expect(
      isPortalAdminConsultationClient({
        ...baseOptions,
        email: 'new@example.com',
        portalUserId: null,
        hasActiveLinkedProject: true,
      })
    ).toBe(false);
  });

  it('includes rows without a project even when the portal user has other projects', () => {
    expect(
      isPortalAdminConsultationClient({
        ...baseOptions,
        email: 'client@example.com',
        portalUserId: 'user_active',
        hasActiveLinkedProject: false,
      })
    ).toBe(true);
  });

  it('excludes consultations linked to admin portal users', () => {
    expect(
      isPortalAdminConsultationClient({
        ...baseOptions,
        email: 'admin@example.com',
        portalUserId: 'user_admin',
        linkedPortalUserRole: 'a',
      })
    ).toBe(false);
  });

  it('excludes consultation emails tied to admin portal users', () => {
    expect(
      isPortalAdminConsultationClient({
        ...baseOptions,
        email: 'admin@example.com',
        portalUserId: null,
      })
    ).toBe(false);
  });
});

describe('isPortalAdminCurrentClient', () => {
  const portalUserIdsWithActiveProjects = new Set(['user_active']);
  const emailsWithActiveProjects = new Set(['active@example.com']);
  const portalUserIdsWithAdminRole = new Set(['user_admin']);
  const emailsWithAdminPortalUsers = new Set(['admin@example.com']);

  const baseOptions = {
    portalUserIdsWithActiveProjects,
    emailsWithActiveProjects,
    portalUserIdsWithAdminRole,
    emailsWithAdminPortalUsers,
    linkedPortalUserRole: null,
  };

  it('includes clients with an active linked project', () => {
    expect(
      isPortalAdminCurrentClient({
        ...baseOptions,
        email: 'client@example.com',
        portalUserId: null,
        hasActiveLinkedProject: true,
      })
    ).toBe(true);
  });

  it('excludes consultation requests without their own active project', () => {
    expect(
      isPortalAdminCurrentClient({
        ...baseOptions,
        email: 'active@example.com',
        portalUserId: 'user_active',
        hasActiveLinkedProject: false,
      })
    ).toBe(false);
  });

  it('excludes clients without an active project', () => {
    expect(
      isPortalAdminCurrentClient({
        ...baseOptions,
        email: 'new@example.com',
        portalUserId: null,
        hasActiveLinkedProject: false,
      })
    ).toBe(false);
  });

  it('excludes admin portal users', () => {
    expect(
      isPortalAdminCurrentClient({
        ...baseOptions,
        email: 'admin@example.com',
        portalUserId: 'user_admin',
        linkedPortalUserRole: 'a',
        hasActiveLinkedProject: true,
      })
    ).toBe(false);
  });
});

describe('isPortalAdminCompletedClient', () => {
  const portalUserIdsWithCompletedProjects = new Set(['user_completed']);
  const emailsWithCompletedProjects = new Set(['completed@example.com']);
  const portalUserIdsWithAdminRole = new Set(['user_admin']);
  const emailsWithAdminPortalUsers = new Set(['admin@example.com']);

  const baseOptions = {
    portalUserIdsWithCompletedProjects,
    emailsWithCompletedProjects,
    portalUserIdsWithAdminRole,
    emailsWithAdminPortalUsers,
    linkedPortalUserRole: null,
  };

  it('includes clients with a completed linked project', () => {
    expect(
      isPortalAdminCompletedClient({
        ...baseOptions,
        email: 'client@example.com',
        portalUserId: null,
        hasCompletedLinkedProject: true,
      })
    ).toBe(true);
  });

  it('excludes consultation requests without their own completed project', () => {
    expect(
      isPortalAdminCompletedClient({
        ...baseOptions,
        email: 'completed@example.com',
        portalUserId: 'user_completed',
        hasCompletedLinkedProject: false,
      })
    ).toBe(false);
  });

  it('excludes clients without a completed project', () => {
    expect(
      isPortalAdminCompletedClient({
        ...baseOptions,
        email: 'new@example.com',
        portalUserId: null,
        hasCompletedLinkedProject: false,
      })
    ).toBe(false);
  });

  it('excludes admin portal users', () => {
    expect(
      isPortalAdminCompletedClient({
        ...baseOptions,
        email: 'admin@example.com',
        portalUserId: 'user_admin',
        linkedPortalUserRole: 'a',
        hasCompletedLinkedProject: true,
      })
    ).toBe(false);
  });
});

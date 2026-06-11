import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resolvePortalAdminSignedInDisplayName } from './portal-admin-session-display';

const { findFirst } = vi.hoisted(() => ({
  findFirst: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    consultationRequest: {
      findFirst,
    },
  },
}));

describe('resolvePortalAdminSignedInDisplayName', () => {
  beforeEach(() => {
    findFirst.mockReset();
  });

  it('uses the linked admin consultation name when available', async () => {
    findFirst.mockResolvedValue({ name: '  Jordan Admin  ' });

    await expect(
      resolvePortalAdminSignedInDisplayName({
        portalUserId: 'admin-user',
        loginEmail: 'admin@all9s.com',
      })
    ).resolves.toBe('Jordan Admin');
  });

  it('falls back to the login email when no linked admin name exists', async () => {
    findFirst.mockResolvedValue(null);

    await expect(
      resolvePortalAdminSignedInDisplayName({
        portalUserId: 'admin-user',
        loginEmail: 'admin@all9s.com',
      })
    ).resolves.toBe('admin@all9s.com');
  });

  it('queries only consultations linked to the admin portal account', async () => {
    findFirst.mockResolvedValue(null);

    await resolvePortalAdminSignedInDisplayName({
      portalUserId: 'admin-user',
      loginEmail: 'admin@all9s.com',
    });

    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          portalUserId: 'admin-user',
          portalUser: { role: 'a' },
        }),
      })
    );
  });
});

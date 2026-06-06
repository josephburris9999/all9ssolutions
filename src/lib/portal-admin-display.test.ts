import { describe, expect, it } from 'vitest';
import { getPortalAdminDisplayName } from './portal-admin-display';

describe('getPortalAdminDisplayName', () => {
  it('returns trimmed login email', () => {
    expect(getPortalAdminDisplayName('  admin@all9s.com  ')).toBe('admin@all9s.com');
  });

  it('falls back to Admin when email is empty', () => {
    expect(getPortalAdminDisplayName('')).toBe('Admin');
    expect(getPortalAdminDisplayName('   ')).toBe('Admin');
  });
});

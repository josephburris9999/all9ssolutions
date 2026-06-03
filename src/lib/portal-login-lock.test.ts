import { describe, expect, it } from 'vitest';
import { isPortalUserLocked, MAX_FAILED_LOGIN_ATTEMPTS } from './portal-login-lock';

describe('portal-login-lock', () => {
  it('treats lockedAt as locked', () => {
    expect(isPortalUserLocked({ lockedAt: new Date(), failedLoginAttempts: 0 })).toBe(true);
  });

  it('treats max failed attempts as locked', () => {
    expect(
      isPortalUserLocked({ lockedAt: null, failedLoginAttempts: MAX_FAILED_LOGIN_ATTEMPTS })
    ).toBe(true);
  });

  it('does not lock below the threshold', () => {
    expect(
      isPortalUserLocked({ lockedAt: null, failedLoginAttempts: MAX_FAILED_LOGIN_ATTEMPTS - 1 })
    ).toBe(false);
  });
});

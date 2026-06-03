import { describe, expect, it } from 'vitest';
import {
  createPasswordResetToken,
  hashPasswordResetToken,
  isPasswordResetTokenValid,
} from './portal-password-reset';

describe('portal-password-reset', () => {
  it('hashes tokens consistently for lookup', () => {
    const token = createPasswordResetToken();
    expect(hashPasswordResetToken(token)).toHaveLength(64);
    expect(hashPasswordResetToken(token)).toBe(hashPasswordResetToken(token));
  });

  it('validates expiry', () => {
    expect(isPasswordResetTokenValid(new Date(Date.now() + 60_000))).toBe(true);
    expect(isPasswordResetTokenValid(new Date(Date.now() - 60_000))).toBe(false);
    expect(isPasswordResetTokenValid(null)).toBe(false);
  });
});

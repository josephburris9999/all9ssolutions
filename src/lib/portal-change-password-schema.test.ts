import { describe, expect, it } from 'vitest';
import { portalChangePasswordSchema } from './portal-change-password-schema';

describe('portalChangePasswordSchema', () => {
  it('accepts matching passwords', () => {
    const result = portalChangePasswordSchema.safeParse({
      newPassword: 'NewPass123!',
      confirmPassword: 'NewPass123!',
    });
    expect(result.success).toBe(true);
  });

  it('rejects mismatched passwords', () => {
    const result = portalChangePasswordSchema.safeParse({
      newPassword: 'NewPass123!',
      confirmPassword: 'Different123!',
    });
    expect(result.success).toBe(false);
  });
});

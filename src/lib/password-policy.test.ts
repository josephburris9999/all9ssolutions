import { describe, expect, it } from 'vitest';
import { passwordPolicySchema } from './password-policy';

describe('passwordPolicySchema', () => {
  it('accepts a password that meets all rules', () => {
    const result = passwordPolicySchema.safeParse('NewPass123!');
    expect(result.success).toBe(true);
  });

  it('rejects passwords shorter than 8 characters', () => {
    const result = passwordPolicySchema.safeParse('Np1!abc');
    expect(result.success).toBe(false);
  });

  it('rejects passwords without a capital letter', () => {
    const result = passwordPolicySchema.safeParse('newpass123!');
    expect(result.success).toBe(false);
  });

  it('rejects passwords without a number', () => {
    const result = passwordPolicySchema.safeParse('NewPass!!!');
    expect(result.success).toBe(false);
  });

  it('rejects passwords without a special character', () => {
    const result = passwordPolicySchema.safeParse('NewPass123');
    expect(result.success).toBe(false);
  });
});

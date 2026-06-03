import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password';

describe('password', () => {
  it('hashes and verifies a password', async () => {
    const hash = await hashPassword('TempPass123!');
    expect(hash).toContain(':');
    await expect(verifyPassword('TempPass123!', hash)).resolves.toBe(true);
    await expect(verifyPassword('wrong', hash)).resolves.toBe(false);
  });
});

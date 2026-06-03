import { describe, expect, it } from 'vitest';
import { portalAgreementSignSchema } from './portal-agreement-schema';

describe('portalAgreementSignSchema', () => {
  it('accepts valid signature payload', () => {
    const result = portalAgreementSignSchema.safeParse({
      signerName: 'Jane Client',
      accepted: true,
      signedAt: new Date().toISOString(),
      clientTimeZone: 'America/Chicago',
    });
    expect(result.success).toBe(true);
  });

  it('rejects when agreement is not accepted', () => {
    const result = portalAgreementSignSchema.safeParse({
      signerName: 'Jane Client',
      accepted: false,
      signedAt: new Date().toISOString(),
    });
    expect(result.success).toBe(false);
  });

  it('rejects signature timestamps too far from server time', () => {
    const result = portalAgreementSignSchema.safeParse({
      signerName: 'Jane Client',
      accepted: true,
      signedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    });
    expect(result.success).toBe(false);
  });
});

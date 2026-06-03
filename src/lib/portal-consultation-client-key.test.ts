import { describe, expect, it } from 'vitest';
import {
  buildConsultationClientKey,
  parseConsultationClientKey,
} from '@/lib/portal-consultation-client-key';

describe('consultation client key', () => {
  it('uses portal user id when present', () => {
    const key = buildConsultationClientKey({
      portalUserId: 'user_abc',
      email: 'client@example.com',
    });
    expect(key).toBe('user_abc');
    expect(parseConsultationClientKey(key)).toEqual({ portalUserId: 'user_abc' });
  });

  it('encodes email when no portal user', () => {
    const key = buildConsultationClientKey({
      portalUserId: null,
      email: 'Client@Example.com',
    });
    expect(key.startsWith('e-')).toBe(true);
    expect(parseConsultationClientKey(key)).toEqual({ email: 'client@example.com' });
  });
});

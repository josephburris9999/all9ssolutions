import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  checkRateLimit,
  formatRetryAfter,
  getClientIp,
  isConsultationRateLimitEnabled,
} from './rate-limit';

describe('checkRateLimit', () => {
  it('allows requests under the limit', () => {
    const key = `test-allow-${Date.now()}`;
    expect(checkRateLimit(key, 3, 60_000)).toEqual({ allowed: true });
    expect(checkRateLimit(key, 3, 60_000)).toEqual({ allowed: true });
  });

  it('blocks requests over the limit', () => {
    const key = `test-block-${Date.now()}`;
    checkRateLimit(key, 2, 60_000);
    checkRateLimit(key, 2, 60_000);
    const blocked = checkRateLimit(key, 2, 60_000);
    expect(blocked.allowed).toBe(false);
    if (!blocked.allowed) {
      expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    }
  });
});

describe('getClientIp', () => {
  it('uses x-forwarded-for when present', () => {
    const headers = new Headers({ 'x-forwarded-for': '203.0.113.1, 10.0.0.1' });
    expect(getClientIp(headers)).toBe('203.0.113.1');
  });

  it('returns dev-local in development without proxy headers', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(getClientIp(new Headers())).toBe('dev-local');
    vi.unstubAllEnvs();
  });
});

describe('formatRetryAfter', () => {
  it('formats seconds, minutes, and hours', () => {
    expect(formatRetryAfter(1)).toBe('1 second');
    expect(formatRetryAfter(45)).toBe('45 seconds');
    expect(formatRetryAfter(90)).toBe('2 minutes');
    expect(formatRetryAfter(7200)).toBe('2 hours');
  });
});

describe('isConsultationRateLimitEnabled', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('is disabled in development', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('DISABLE_CONSULTATION_RATE_LIMIT', '');
    expect(isConsultationRateLimitEnabled()).toBe(false);
  });

  it('can be disabled explicitly in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('DISABLE_CONSULTATION_RATE_LIMIT', 'true');
    expect(isConsultationRateLimitEnabled()).toBe(false);
  });

  it('is enabled in production by default', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('DISABLE_CONSULTATION_RATE_LIMIT', '');
    expect(isConsultationRateLimitEnabled()).toBe(true);
  });
});

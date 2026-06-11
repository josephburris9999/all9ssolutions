import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { validateBotSignals } from './bot-protection';

describe('validateBotSignals', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-22T12:00:00.000Z'));
    vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', '');
    vi.stubEnv('TURNSTILE_SECRET_KEY', '');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  function baseInput(overrides: Partial<Parameters<typeof validateBotSignals>[0]> = {}) {
    return {
      website: '',
      _formStartedAt: Date.now() - 5_000,
      userAgent: 'Mozilla/5.0 (Test)',
      ...overrides,
    };
  }

  it('accepts valid submissions', () => {
    expect(validateBotSignals(baseInput())).toEqual({ ok: true });
  });

  it('rejects honeypot website values', () => {
    const result = validateBotSignals({ ...baseInput(), website: 'http://spam.test' });
    expect(result).toEqual({ ok: false, reason: 'Submission rejected' });
  });

  it('rejects submissions that are too fast', () => {
    const result = validateBotSignals(
      baseInput({ _formStartedAt: Date.now() - 1_000 })
    );
    expect(result).toEqual({ ok: false, reason: 'Please take a moment before submitting' });
  });

  it('rejects missing user agent', () => {
    const result = validateBotSignals(baseInput({ userAgent: '' }));
    expect(result).toEqual({ ok: false, reason: 'Submission rejected' });
  });
});

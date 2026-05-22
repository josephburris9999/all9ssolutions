import { describe, expect, it } from 'vitest';
import { formatPhoneNumber, getPhoneDigits, isCompletePhoneNumber } from './phone';

describe('phone', () => {
  it('extracts up to 10 digits', () => {
    expect(getPhoneDigits('(555) 123-4567')).toBe('5551234567');
    expect(getPhoneDigits('5551234567890')).toBe('5551234567');
  });

  it('formats partial and complete numbers', () => {
    expect(formatPhoneNumber('555')).toBe('(555');
    expect(formatPhoneNumber('5551234')).toBe('(555) 123-4');
    expect(formatPhoneNumber('5551234567')).toBe('(555) 123-4567');
    expect(formatPhoneNumber('')).toBe('');
  });

  it('detects complete phone numbers', () => {
    expect(isCompletePhoneNumber('(555) 123-4567')).toBe(true);
    expect(isCompletePhoneNumber('(555) 123')).toBe(false);
    expect(isCompletePhoneNumber('(555)')).toBe(false);
  });
});

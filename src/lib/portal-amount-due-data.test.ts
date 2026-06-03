import { describe, expect, it } from 'vitest';
import { formatCurrencyAmount } from './portal-amount-due-data';

describe('formatCurrencyAmount', () => {
  it('formats zero as USD', () => {
    expect(formatCurrencyAmount(0)).toBe('$0.00');
  });

  it('formats amounts with grouping and cents', () => {
    expect(formatCurrencyAmount(1234.5)).toBe('$1,234.50');
  });
});

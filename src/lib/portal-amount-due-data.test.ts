import { describe, expect, it } from 'vitest';
import {
  calculateClientLedgerTotalDue,
  formatCurrencyAmount,
  sumAmountDueLineItems,
} from './portal-amount-due-data';

describe('formatCurrencyAmount', () => {
  it('formats zero as USD', () => {
    expect(formatCurrencyAmount(0)).toBe('$0.00');
  });

  it('formats amounts with grouping and cents', () => {
    expect(formatCurrencyAmount(1234.5)).toBe('$1,234.50');
  });
});

describe('sumAmountDueLineItems', () => {
  it('sums line item amounts', () => {
    expect(
      sumAmountDueLineItems([
        { id: 'a', amount: 100, description: 'Milestone 1' },
        { id: 'b', amount: 50.5, description: 'Enhancement' },
      ])
    ).toBe(150.5);
  });

  it('returns zero for an empty list', () => {
    expect(sumAmountDueLineItems([])).toBe(0);
  });
});

describe('calculateClientLedgerTotalDue', () => {
  it('adds deposit and line items then subtracts paid', () => {
    expect(
      calculateClientLedgerTotalDue({
        depositAmount: 1000,
        paidAmount: 250,
        amountDue: 150,
        lineItems: [
          { id: 'a', amount: 100, description: 'Milestone 1' },
          { id: 'b', amount: 50, description: 'Enhancement' },
        ],
      })
    ).toBe(900);
  });

  it('ignores amountDue field and uses only ledger rows', () => {
    expect(
      calculateClientLedgerTotalDue({
        depositAmount: 500,
        paidAmount: 100,
        amountDue: 9999,
        lineItems: [],
      })
    ).toBe(400);
  });
});

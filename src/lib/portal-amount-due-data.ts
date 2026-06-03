export type PortalAmountSummary = {
  depositAmount: number;
  amountDue: number;
  paidAmount: number;
};

/** Format a USD amount for display (e.g. $1,234.56). */
export function formatCurrencyAmount(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

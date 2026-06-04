export type PortalAmountDueLineItem = {
  id: string;
  amount: number;
  description: string;
};

export type PortalAmountSummary = {
  depositAmount: number;
  paidAmount: number;
  /** Sum of line-item amounts. */
  amountDue: number;
  lineItems: PortalAmountDueLineItem[];
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

export function sumAmountDueLineItems(lineItems: PortalAmountDueLineItem[]): number {
  return lineItems.reduce((total, item) => total + Number(item.amount), 0);
}

/** Client ledger table: deposit + line items − paid. */
export function calculateClientLedgerTotalDue(amounts: PortalAmountSummary): number {
  return (
    Number(amounts.depositAmount) +
    sumAmountDueLineItems(amounts.lineItems) -
    Number(amounts.paidAmount)
  );
}

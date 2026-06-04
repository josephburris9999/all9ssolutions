'use client';

import { useState } from 'react';
import { CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PaymentMethodIcons } from '@/components/payment-method-icons';
import {
  calculateClientLedgerTotalDue,
  formatCurrencyAmount,
  type PortalAmountDueLineItem,
  type PortalAmountSummary,
} from '@/lib/portal-amount-due-data';

type PortalAmountDueSectionProps = {
  amounts: PortalAmountSummary;
  showPaymentActions?: boolean;
  /** Client portal: deposit first row, line items, paid last row (no summary cards). */
  ledgerLayout?: boolean;
};

function AmountCard({ label, value }: { label: string; value: number }) {
  const formatted = formatCurrencyAmount(value);
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1 rounded-md border border-border/80 bg-muted/20 px-5 py-4">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span
        className="text-2xl font-semibold tabular-nums tracking-tight text-foreground sm:text-3xl"
        aria-label={`${label}: ${formatted}`}
      >
        {formatted}
      </span>
    </div>
  );
}

const amountDueDescriptionCellClass =
  'w-[65%] px-2 py-3 break-words text-foreground sm:px-4';
const amountDueAmountCellClass =
  'w-[35%] whitespace-nowrap px-2 py-3 text-right tabular-nums text-foreground sm:px-4';

function AmountTableRow({
  description,
  amount,
  className,
}: {
  description: string;
  amount: number;
  className?: string;
}) {
  return (
    <tr className={className}>
      <td className={amountDueDescriptionCellClass}>{description}</td>
      <td className={amountDueAmountCellClass}>{formatCurrencyAmount(amount)}</td>
    </tr>
  );
}

function AmountDueTable({
  amounts,
  ledgerLayout,
}: {
  amounts: PortalAmountSummary;
  ledgerLayout: boolean;
}) {
  const lineItems = amounts.lineItems ?? [];
  const totalDueDisplay = ledgerLayout
    ? calculateClientLedgerTotalDue(amounts)
    : amounts.amountDue;

  return (
    <div className="rounded-md border border-border/80 bg-muted/20">
      <table className="w-full min-w-0 table-fixed text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th scope="col" className={`${amountDueDescriptionCellClass} font-medium`}>
              Description
            </th>
            <th scope="col" className={`${amountDueAmountCellClass} font-medium`}>
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {ledgerLayout ? (
            <>
              <AmountTableRow description="Deposit" amount={amounts.depositAmount} />
              {lineItems.map((item: PortalAmountDueLineItem) => (
                <AmountTableRow
                  key={item.id}
                  description={item.description}
                  amount={item.amount}
                  className="border-b border-border"
                />
              ))}
              <AmountTableRow description="Paid" amount={amounts.paidAmount} />
            </>
          ) : lineItems.length === 0 ? (
            <tr>
              <td colSpan={2} className="break-words px-2 py-6 text-muted-foreground sm:px-4">
                No amount due line items for this project yet.
              </td>
            </tr>
          ) : (
            lineItems.map((item) => (
              <AmountTableRow
                key={item.id}
                description={item.description}
                amount={item.amount}
                className="border-b border-border last:border-b-0"
              />
            ))
          )}
        </tbody>
        <tfoot>
          <tr className="bg-muted/20">
            <th scope="row" className={`${amountDueDescriptionCellClass} font-semibold`}>
              Total due
            </th>
            <td
              className={`${amountDueAmountCellClass} text-base font-semibold`}
            >
              {formatCurrencyAmount(totalDueDisplay)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export function PortalAmountDueSection({
  amounts,
  showPaymentActions = true,
  ledgerLayout = false,
}: PortalAmountDueSectionProps) {
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  return (
    <section className="mt-12 max-w-3xl" aria-labelledby="portal-amount-due-heading">
      <h2 id="portal-amount-due-heading" className="mb-6 text-2xl font-bold text-foreground">
        Amount Due
      </h2>

      {!ledgerLayout ? (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AmountCard label="Deposit" value={amounts.depositAmount} />
          <AmountCard label="Paid" value={amounts.paidAmount} />
        </div>
      ) : null}

      <div className="space-y-6">
        {!ledgerLayout ? (
          <h3 className="text-sm font-semibold text-foreground">Amount due details</h3>
        ) : null}

        <AmountDueTable amounts={amounts} ledgerLayout={ledgerLayout} />

        {showPaymentActions ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <PaymentMethodIcons layout="row" className="min-w-0 max-w-full flex-1 justify-start" />
            <Button type="button" className="w-full shrink-0 sm:w-auto" onClick={() => setPaymentModalOpen(true)}>
              <CreditCard className="size-4" aria-hidden />
              Make a Payment
            </Button>
          </div>
        ) : null}

        <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Coming soon</DialogTitle>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" onClick={() => setPaymentModalOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}

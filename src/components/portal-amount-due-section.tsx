'use client';

import { useState } from 'react';
import { CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PaymentMethodIcons } from '@/components/payment-method-icons';
import { useToast } from '@/hooks/use-toast';
import {
  calculateClientLedgerTotalDue,
  formatCurrencyAmount,
  type PortalAmountDueLineItem,
  type PortalAmountSummary,
} from '@/lib/portal-amount-due-data';
import { PORTAL_PROJECT_AGREEMENTS_UNSIGNED_MESSAGE } from '@/lib/portal-agreement-data';

type PortalAmountDueSectionProps = {
  amounts: PortalAmountSummary;
  showPaymentActions?: boolean;
  /** Client portal: deposit first row, line items, paid last row (no summary cards). */
  ledgerLayout?: boolean;
  /** Client portal: payment actions disabled until all project agreements are signed. Omit for admin views. */
  allAgreementsSigned?: boolean;
  /** Client portal: selected project to pay through Stripe Checkout. */
  projectId?: string | null;
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
  allAgreementsSigned,
  projectId,
}: PortalAmountDueSectionProps) {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const { toast } = useToast();
  const totalDue = ledgerLayout
    ? calculateClientLedgerTotalDue(amounts)
    : amounts.amountDue;
  const paymentsEnabled = allAgreementsSigned !== false && Boolean(projectId) && totalDue > 0;

  async function startStripeCheckout() {
    if (!paymentsEnabled || !projectId) return;

    setIsCheckingOut(true);
    try {
      const response = await fetch('/api/portal/payments/stripe-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };

      if (!response.ok || !data.url) {
        throw new Error(data.error || 'Unable to start Stripe Checkout.');
      }

      window.location.assign(data.url);
    } catch (error) {
      setIsCheckingOut(false);
      toast({
        title: 'Payment unavailable',
        description: error instanceof Error ? error.message : 'Unable to start Stripe Checkout.',
        variant: 'destructive',
      });
    }
  }

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

        {allAgreementsSigned === false ? (
          <p className="text-sm text-muted-foreground">{PORTAL_PROJECT_AGREEMENTS_UNSIGNED_MESSAGE}</p>
        ) : null}

        {showPaymentActions ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <PaymentMethodIcons layout="row" className="min-w-0 max-w-full flex-1 justify-start" />
            <Button
              type="button"
              className="w-full shrink-0 sm:w-auto"
              disabled={!paymentsEnabled || isCheckingOut}
              onClick={startStripeCheckout}
            >
              <CreditCard className="size-4" aria-hidden />
              {isCheckingOut ? 'Opening checkout...' : 'Make a Payment'}
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

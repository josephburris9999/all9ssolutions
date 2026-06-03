'use client';

import { CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PaymentMethodIcons } from '@/components/payment-method-icons';
import {
  formatCurrencyAmount,
  type PortalAmountSummary,
} from '@/lib/portal-amount-due-data';
import { useToast } from '@/hooks/use-toast';

type PortalAmountDueSectionProps = {
  amounts: PortalAmountSummary;
  showPaymentActions?: boolean;
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

export function PortalAmountDueSection({
  amounts,
  showPaymentActions = true,
}: PortalAmountDueSectionProps) {
  const { toast } = useToast();

  function handleMakePayment() {
    toast({
      title: 'Payments coming soon',
      description: 'Online payment will be available here shortly. Contact us if you need to pay by another method.',
    });
  }

  return (
    <section className="w-full" aria-labelledby="portal-amount-due-heading">
      <h2 id="portal-amount-due-heading" className="mb-6 text-2xl font-bold text-foreground">
        Amount Due
      </h2>

      <div className="rounded-lg border border-border bg-card p-6 md:p-8">
        <div
          className={
            showPaymentActions
              ? 'flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-8'
              : undefined
          }
        >
          <div className="grid min-w-0 flex-1 grid-cols-1 gap-4 sm:grid-cols-3">
            <AmountCard label="Deposit" value={amounts.depositAmount} />
            <AmountCard label="Due" value={amounts.amountDue} />
            <AmountCard label="Paid" value={amounts.paidAmount} />
          </div>

          {showPaymentActions ? (
            <div className="flex shrink-0 flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between lg:flex-col lg:items-stretch lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
              <Button type="button" className="w-full sm:w-auto lg:w-full" onClick={handleMakePayment}>
                <CreditCard className="size-4" aria-hidden />
                Make a payment
              </Button>
              <PaymentMethodIcons className="justify-center sm:justify-end lg:justify-center" />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

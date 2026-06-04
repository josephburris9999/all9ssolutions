import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type PaymentMethodIconsProps = {
  className?: string;
  /** Row of icons (wraps when narrow) or fixed grid below a full-width action. */
  layout?: 'row' | 'grid';
};

function IconFrame({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex h-8 w-12 items-center justify-center rounded border border-border bg-background px-1',
        className
      )}
      title={label}
      aria-label={label}
    >
      {children}
    </span>
  );
}

export function PaymentMethodIcons({ className, layout = 'row' }: PaymentMethodIconsProps) {
  return (
    <div
      className={cn(
        layout === 'grid'
          ? 'grid w-full grid-cols-3 gap-2 sm:grid-cols-6'
          : 'flex min-w-0 flex-wrap items-center gap-2',
        className
      )}
      aria-label="Accepted payment methods"
    >
      <IconFrame label="Visa">
        <svg viewBox="0 0 48 16" className="h-3.5 w-auto" aria-hidden>
          <text x="2" y="12" fill="currentColor" className="fill-[#1A1F71] text-[11px] font-bold">
            VISA
          </text>
        </svg>
      </IconFrame>
      <IconFrame label="Mastercard">
        <svg viewBox="0 0 32 20" className="h-4 w-auto" aria-hidden>
          <circle cx="11" cy="10" r="7" fill="#EB001B" />
          <circle cx="21" cy="10" r="7" fill="#F79E1B" fillOpacity="0.9" />
        </svg>
      </IconFrame>
      <IconFrame label="American Express">
        <svg viewBox="0 0 48 16" className="h-3.5 w-auto" aria-hidden>
          <rect width="48" height="16" rx="2" fill="#2E77BC" />
          <text x="4" y="11" fill="white" className="text-[7px] font-bold">
            AMEX
          </text>
        </svg>
      </IconFrame>
      <IconFrame label="Discover">
        <svg viewBox="0 0 48 16" className="h-3.5 w-auto" aria-hidden>
          <text x="1" y="11" fill="currentColor" className="fill-[#FF6000] text-[8px] font-semibold">
            DISC
          </text>
        </svg>
      </IconFrame>
      <IconFrame label="PayPal">
        <svg viewBox="0 0 48 16" className="h-3.5 w-auto" aria-hidden>
          <text x="2" y="12" fill="currentColor" className="fill-[#003087] text-[9px] font-bold">
            Pay
          </text>
        </svg>
      </IconFrame>
    </div>
  );
}

"use client";

import * as React from 'react';
import { ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';

type AccordionContextValue = {
  openValues: string[];
  toggle: (value: string) => void;
  type: 'single' | 'multiple';
};

const AccordionContext = React.createContext<AccordionContextValue | null>(null);

function normalizeAccordionValues(value: string[] | string | undefined | null): string[] {
  if (value == null) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return value.length > 0 ? [value] : [];
  return [];
}

function useAccordionContext() {
  const context = React.useContext(AccordionContext);
  if (!context) {
    throw new Error('Accordion components must be used within Accordion');
  }
  return context;
}

type AccordionProps = {
  type?: 'single' | 'multiple';
  defaultValue?: string | string[];
  value?: string[];
  onValueChange?: (values: string[]) => void;
  className?: string;
  children: React.ReactNode;
};

function Accordion({
  type = 'single',
  defaultValue,
  value: controlledValue,
  onValueChange,
  className,
  children,
}: AccordionProps) {
  const [uncontrolledValues, setUncontrolledValues] = React.useState<string[]>(() => {
    if (!defaultValue) return [];
    return Array.isArray(defaultValue) ? defaultValue : [defaultValue];
  });

  const isControlled = controlledValue !== undefined;
  const openValues = normalizeAccordionValues(isControlled ? controlledValue : uncontrolledValues);

  const setOpenValues = React.useCallback(
    (updater: string[] | ((prev: string[]) => string[])) => {
      const resolve = (prev: string[]) =>
        normalizeAccordionValues(typeof updater === 'function' ? updater(prev) : updater);

      if (onValueChange) {
        onValueChange(resolve(openValues));
      } else {
        setUncontrolledValues((prev) => resolve(prev));
      }
    },
    [onValueChange, openValues]
  );

  const toggle = React.useCallback(
    (value: string) => {
      setOpenValues((prev) => {
        if (type === 'single') {
          return prev.includes(value) ? [] : [value];
        }
        return prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value];
      });
    },
    [type, setOpenValues]
  );

  return (
    <AccordionContext.Provider value={{ openValues, toggle, type }}>
      <div className={cn('space-y-2', className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

type AccordionItemProps = React.HTMLAttributes<HTMLDivElement> & {
  value: string;
};

function AccordionItem({ value, className, children, ...props }: AccordionItemProps) {
  return (
    <div
      data-accordion-item={value}
      className={cn('min-w-0 overflow-hidden rounded-lg border border-border bg-card', className)}
      {...props}
    >
      {children}
    </div>
  );
}

type AccordionTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  value: string;
  actions?: React.ReactNode;
};

function AccordionTrigger({ value, actions, className, children, ...props }: AccordionTriggerProps) {
  const { openValues, toggle } = useAccordionContext();
  const open = openValues.includes(value);

  return (
    <div className="flex w-full flex-col gap-3 px-4 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => toggle(value)}
        className={cn(
          'flex w-full min-w-0 items-center justify-between gap-4 text-left text-sm transition-colors hover:text-primary sm:flex-1',
          className
        )}
        {...props}
      >
        <span className="min-w-0 flex-1">{children}</span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')}
        />
      </button>
      {actions ? (
        <div className="w-full shrink-0 sm:w-auto [&_button]:w-full sm:[&_button]:w-auto [&_a]:w-full sm:[&_a]:w-auto">
          {actions}
        </div>
      ) : null}
    </div>
  );
}

type AccordionContentProps = React.HTMLAttributes<HTMLDivElement> & {
  value: string;
};

function AccordionContent({ value, className, children, ...props }: AccordionContentProps) {
  const { openValues } = useAccordionContext();
  const open = openValues.includes(value);

  if (!open) return null;

  return (
    <div className={cn('min-w-0 border-t border-border px-4 pb-4 pt-4', className)} {...props}>
      {children}
    </div>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };

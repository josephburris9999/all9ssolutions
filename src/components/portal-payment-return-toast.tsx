'use client';

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

function clearPaymentReturnParams(pathname: string, searchParams: URLSearchParams): string {
  const params = new URLSearchParams(searchParams);
  params.delete('payment');
  params.delete('paymentId');
  const nextQuery = params.toString();
  return nextQuery ? `${pathname}?${nextQuery}` : pathname;
}

export function PortalPaymentReturnToast() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    const paymentId = searchParams.get('paymentId')?.trim();
    if (paymentStatus !== 'success' && paymentStatus !== 'failed') {
      return;
    }

    if (paymentStatus === 'success') {
      toast({
        title: 'Payment successful',
        description: 'Your payment was received. Your balance will update shortly.',
      });
    } else {
      toast({
        title: 'Payment failed',
        description: 'Your payment was not completed. No funds were collected.',
        variant: 'destructive',
      });

      if (paymentId) {
        const notificationKey = `stripe-payment-return:${paymentId}:failed`;
        if (!window.sessionStorage.getItem(notificationKey)) {
          window.sessionStorage.setItem(notificationKey, 'true');
          void fetch('/api/portal/payments/stripe-return', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId, status: 'failed' }),
          });
        }
      }
    }

    router.replace(clearPaymentReturnParams(pathname, searchParams), { scroll: false });
  }, [pathname, router, searchParams, toast]);

  return null;
}

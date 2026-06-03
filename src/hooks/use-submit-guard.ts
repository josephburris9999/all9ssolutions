'use client';

import { useCallback, useRef, useState } from 'react';

/**
 * Prevents duplicate form submissions from double-clicks before React re-renders
 * with a disabled submit button.
 */
export function useSubmitGuard() {
  const submitInFlightRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const runGuardedSubmit = useCallback(async <T>(submit: () => Promise<T>): Promise<T | undefined> => {
    if (submitInFlightRef.current) {
      return undefined;
    }

    submitInFlightRef.current = true;
    setIsSubmitting(true);

    try {
      return await submit();
    } finally {
      submitInFlightRef.current = false;
      setIsSubmitting(false);
    }
  }, []);

  return { isSubmitting, runGuardedSubmit };
}

'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { PortalAdminClientCategoryCounts } from '@/lib/portal-admin-nav';

/** Poll category counts while an admin has the portal open and the tab is visible. */
const CATEGORY_COUNTS_POLL_INTERVAL_MS = 60_000;

type PortalAdminCategoryCountsContextValue = {
  counts: PortalAdminClientCategoryCounts;
  applyCounts: (counts: PortalAdminClientCategoryCounts) => void;
  refreshCounts: () => Promise<void>;
};

const PortalAdminCategoryCountsContext = createContext<PortalAdminCategoryCountsContextValue | null>(
  null
);

export async function fetchPortalAdminClientCategoryCounts(): Promise<PortalAdminClientCategoryCounts | null> {
  const response = await fetch('/api/portal/admin/client-category-counts', {
    method: 'GET',
    cache: 'no-store',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    ok?: boolean;
    counts?: PortalAdminClientCategoryCounts;
  };

  if (!payload.ok || !payload.counts) {
    return null;
  }

  return payload.counts;
}

export function PortalAdminCategoryCountsProvider({
  initialCounts,
  children,
}: {
  initialCounts: PortalAdminClientCategoryCounts;
  children: ReactNode;
}) {
  const [counts, setCounts] = useState(initialCounts);

  const applyCounts = useCallback((nextCounts: PortalAdminClientCategoryCounts) => {
    setCounts(nextCounts);
  }, []);

  const refreshCounts = useCallback(async () => {
    const nextCounts = await fetchPortalAdminClientCategoryCounts();
    if (nextCounts) {
      setCounts(nextCounts);
    }
  }, []);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    function stopPolling() {
      if (intervalId === null) {
        return;
      }

      clearInterval(intervalId);
      intervalId = null;
    }

    function startPolling() {
      if (intervalId !== null) {
        return;
      }

      intervalId = setInterval(() => {
        void refreshCounts();
      }, CATEGORY_COUNTS_POLL_INTERVAL_MS);
    }

    function syncPollingWithVisibility() {
      if (document.visibilityState === 'visible') {
        startPolling();
      } else {
        stopPolling();
      }
    }

    syncPollingWithVisibility();
    document.addEventListener('visibilitychange', syncPollingWithVisibility);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', syncPollingWithVisibility);
    };
  }, [refreshCounts]);

  const value = useMemo(
    () => ({
      counts,
      applyCounts,
      refreshCounts,
    }),
    [counts, applyCounts, refreshCounts]
  );

  return (
    <PortalAdminCategoryCountsContext.Provider value={value}>
      {children}
    </PortalAdminCategoryCountsContext.Provider>
  );
}

export function usePortalAdminCategoryCounts(): PortalAdminClientCategoryCounts {
  const context = useContext(PortalAdminCategoryCountsContext);
  if (!context) {
    throw new Error('usePortalAdminCategoryCounts must be used within PortalAdminCategoryCountsProvider');
  }

  return context.counts;
}

export function useApplyPortalAdminCategoryCounts(): (
  counts: PortalAdminClientCategoryCounts
) => void {
  const context = useContext(PortalAdminCategoryCountsContext);
  if (!context) {
    throw new Error(
      'useApplyPortalAdminCategoryCounts must be used within PortalAdminCategoryCountsProvider'
    );
  }

  return context.applyCounts;
}

export function useRefreshPortalAdminCategoryCounts(): () => Promise<void> {
  const context = useContext(PortalAdminCategoryCountsContext);
  if (!context) {
    throw new Error(
      'useRefreshPortalAdminCategoryCounts must be used within PortalAdminCategoryCountsProvider'
    );
  }

  return context.refreshCounts;
}

import { useCallback } from 'react';
import {
  useApplyPortalAdminCategoryCounts,
  useRefreshPortalAdminCategoryCounts,
} from '@/contexts/portal-admin-category-counts-context';
import type { PortalAdminClientCategoryCounts } from '@/lib/portal-admin-nav';

export function usePortalAdminCategoryCountsAfterMutation() {
  const applyCounts = useApplyPortalAdminCategoryCounts();
  const refreshCounts = useRefreshPortalAdminCategoryCounts();

  return useCallback(
    async (counts?: PortalAdminClientCategoryCounts | null) => {
      if (counts) {
        applyCounts(counts);
        return;
      }

      await refreshCounts();
    },
    [applyCounts, refreshCounts]
  );
}

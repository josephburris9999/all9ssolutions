import type { SupabaseClient } from '@supabase/supabase-js';

const DEBOUNCE_MS = 300;

export function subscribePortalAdminCategoryCountsRealtime(
  supabase: SupabaseClient,
  onChange: () => void
): { unsubscribe: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const channel = supabase
    .channel('portal-admin-client-category-counts')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'Project',
      },
      () => {
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
          timeoutId = null;
          onChange();
        }, DEBOUNCE_MS);
      }
    )
    .subscribe();

  return {
    unsubscribe() {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      void supabase.removeChannel(channel);
    },
  };
}

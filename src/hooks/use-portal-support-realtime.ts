'use client';

import { useCallback, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { PortalSupportMessage } from '@/lib/portal-support-data';
import {
  getPortalSupportRealtimeChannelName,
  mapProgressMessageRow,
} from '@/lib/portal-support-realtime';

type UsePortalSupportRealtimeOptions = {
  progressId: string | null;
  onMessage: (message: PortalSupportMessage) => void;
};

export function usePortalSupportRealtime({ progressId, onMessage }: UsePortalSupportRealtimeOptions) {
  const handleMessage = useCallback(
    (message: PortalSupportMessage) => {
      onMessage(message);
    },
    [onMessage]
  );

  useEffect(() => {
    if (!progressId) {
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      return;
    }

    const channel = supabase
      .channel(getPortalSupportRealtimeChannelName(progressId))
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ProgressMessage',
          filter: `progressId=eq.${progressId}`,
        },
        (payload) => {
          const message = mapProgressMessageRow(payload.new as Record<string, unknown>);
          if (message) {
            handleMessage(message);
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [progressId, handleMessage]);
}

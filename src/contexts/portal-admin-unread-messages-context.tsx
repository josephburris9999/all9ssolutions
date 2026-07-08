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
import type { PortalAdminUnreadMessageProject } from '@/lib/portal-admin-unread-messages';

const UNREAD_MESSAGES_POLL_INTERVAL_MS = 120_000;

export type PortalAdminUnreadMessagesState = {
  hasUnviewed: boolean;
  projects: PortalAdminUnreadMessageProject[];
};

type PortalAdminUnreadMessagesContextValue = {
  unreadMessages: PortalAdminUnreadMessagesState;
  refreshUnreadMessages: () => Promise<void>;
};

const PortalAdminUnreadMessagesContext = createContext<PortalAdminUnreadMessagesContextValue | null>(
  null
);

export async function fetchPortalAdminUnreadMessages(): Promise<PortalAdminUnreadMessagesState | null> {
  const response = await fetch('/api/portal/admin/unread-messages', {
    method: 'GET',
    cache: 'no-store',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    ok?: boolean;
    hasUnviewed?: boolean;
    projects?: PortalAdminUnreadMessageProject[];
  };

  if (!payload.ok || !Array.isArray(payload.projects)) {
    return null;
  }

  return {
    hasUnviewed: Boolean(payload.hasUnviewed),
    projects: payload.projects,
  };
}

export function PortalAdminUnreadMessagesProvider({
  initialUnreadMessages,
  children,
}: {
  initialUnreadMessages: PortalAdminUnreadMessagesState;
  children: ReactNode;
}) {
  const [unreadMessages, setUnreadMessages] = useState(initialUnreadMessages);

  const refreshUnreadMessages = useCallback(async () => {
    const nextState = await fetchPortalAdminUnreadMessages();
    if (nextState) {
      setUnreadMessages(nextState);
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
        void refreshUnreadMessages();
      }, UNREAD_MESSAGES_POLL_INTERVAL_MS);
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
  }, [refreshUnreadMessages]);

  const value = useMemo(
    () => ({
      unreadMessages,
      refreshUnreadMessages,
    }),
    [unreadMessages, refreshUnreadMessages]
  );

  return (
    <PortalAdminUnreadMessagesContext.Provider value={value}>
      {children}
    </PortalAdminUnreadMessagesContext.Provider>
  );
}

export function usePortalAdminUnreadMessages(): PortalAdminUnreadMessagesState {
  const context = useContext(PortalAdminUnreadMessagesContext);
  if (!context) {
    throw new Error('usePortalAdminUnreadMessages must be used within PortalAdminUnreadMessagesProvider');
  }

  return context.unreadMessages;
}

export function useRefreshPortalAdminUnreadMessages(): () => Promise<void> {
  const context = useContext(PortalAdminUnreadMessagesContext);
  if (!context) {
    throw new Error(
      'useRefreshPortalAdminUnreadMessages must be used within PortalAdminUnreadMessagesProvider'
    );
  }

  return context.refreshUnreadMessages;
}

/** No-op outside the admin shell — safe for shared portal components. */
export function useOptionalRefreshPortalAdminUnreadMessages(): (() => Promise<void>) | undefined {
  const context = useContext(PortalAdminUnreadMessagesContext);
  return context?.refreshUnreadMessages;
}

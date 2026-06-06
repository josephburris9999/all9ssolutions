'use client';

import React from 'react';
import { PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { PortalAdminNav } from '@/components/portal-admin-nav';
import { Button } from '@/components/ui/button';
import {
  PortalAdminCategoryCountsProvider,
  usePortalAdminCategoryCounts,
} from '@/contexts/portal-admin-category-counts-context';
import {
  PortalAdminUnreadMessagesProvider,
  usePortalAdminUnreadMessages,
  type PortalAdminUnreadMessagesState,
} from '@/contexts/portal-admin-unread-messages-context';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { PortalAdminClientCategoryCounts } from '@/lib/portal-admin-nav';

const SIDEBAR_STORAGE_KEY = 'portal-admin-sidebar-collapsed';

const navToggleRowClassName =
  'flex w-full items-center rounded-lg px-3 py-2.5 text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground';

type PortalAdminShellProps = {
  children: React.ReactNode;
  clientCategoryCounts: PortalAdminClientCategoryCounts;
  initialUnreadMessages: PortalAdminUnreadMessagesState;
};

function PortalAdminShellNav({
  collapsed,
  pendingExpandSectionId,
  onPendingExpandHandled,
  onRequestExpand,
  onNavigate,
}: {
  collapsed?: boolean;
  pendingExpandSectionId?: string | null;
  onPendingExpandHandled?: () => void;
  onRequestExpand?: (sectionId?: string) => void;
  onNavigate?: () => void;
}) {
  const counts = usePortalAdminCategoryCounts();
  const unreadMessages = usePortalAdminUnreadMessages();

  return (
    <PortalAdminNav
      collapsed={collapsed}
      pendingExpandSectionId={pendingExpandSectionId}
      clientCategoryCounts={counts}
      unreadMessages={unreadMessages}
      onPendingExpandHandled={onPendingExpandHandled}
      onRequestExpand={onRequestExpand}
      onNavigate={onNavigate}
    />
  );
}

export function PortalAdminShell({
  children,
  clientCategoryCounts,
  initialUnreadMessages,
}: PortalAdminShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);
  const [pendingExpandSectionId, setPendingExpandSectionId] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (stored === 'true') {
        setCollapsed(true);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  function setSidebarCollapsed(next: boolean) {
    setCollapsed(next);
    try {
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
    } catch {
      // ignore storage errors
    }
  }

  function handleRequestExpand(sectionId?: string) {
    if (sectionId) {
      setPendingExpandSectionId(sectionId);
    }
    setSidebarCollapsed(false);
  }

  function handlePendingExpandHandled() {
    setPendingExpandSectionId(null);
  }

  return (
    <PortalAdminCategoryCountsProvider initialCounts={clientCategoryCounts}>
      <PortalAdminUnreadMessagesProvider initialUnreadMessages={initialUnreadMessages}>
      <div className="flex flex-1 bg-background pt-20">
      <aside
        className={cn(
          'hidden shrink-0 border-r border-border bg-card/30 transition-[width] duration-200 ease-in-out md:block',
          collapsed ? 'w-14' : 'w-64'
        )}
      >
        <div className="sticky top-20 flex max-h-[calc(100vh-5rem)] flex-col">
          <div className="shrink-0 border-b border-border">
            <div className={cn('py-3', collapsed ? 'px-1.5' : 'px-3')}>
              <Button
                type="button"
                variant="ghost"
                className={cn(
                  navToggleRowClassName,
                  'h-auto hover:bg-secondary/60',
                  collapsed ? 'justify-center' : 'justify-end'
                )}
                aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
                aria-expanded={!collapsed}
                onClick={() => setSidebarCollapsed(!collapsed)}
              >
                {collapsed ? (
                  <PanelLeftOpen className="h-4 w-4 shrink-0" />
                ) : (
                  <PanelLeftClose className="h-4 w-4 shrink-0" />
                )}
              </Button>
            </div>
          </div>

          <div className={cn('flex-1 overflow-y-auto overflow-x-hidden py-3', collapsed ? 'px-1.5' : 'px-3')}>
            <PortalAdminShellNav
              collapsed={collapsed}
              pendingExpandSectionId={pendingExpandSectionId}
              onPendingExpandHandled={handlePendingExpandHandled}
              onRequestExpand={handleRequestExpand}
            />
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="flex justify-start border-b border-border px-4 py-3 md:hidden">
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button type="button" variant="outline" size="icon" aria-label="Open admin navigation">
                <PanelLeftOpen className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[min(100%,18rem)] border-border bg-background p-0 [&>button]:hidden"
            >
              <SheetHeader className="sr-only">
                <SheetTitle>Admin navigation</SheetTitle>
              </SheetHeader>
              <div className="shrink-0 border-b border-border px-3 pt-3">
                <SheetClose asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    className={cn(navToggleRowClassName, 'h-auto justify-end hover:bg-secondary/60')}
                    aria-label="Close navigation"
                  >
                    <X className="h-4 w-4 shrink-0" />
                  </Button>
                </SheetClose>
              </div>
              <div className="overflow-y-auto px-3 py-3">
                <PortalAdminShellNav onNavigate={() => setMobileNavOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {children}
      </div>
    </div>
      </PortalAdminUnreadMessagesProvider>
    </PortalAdminCategoryCountsProvider>
  );
}

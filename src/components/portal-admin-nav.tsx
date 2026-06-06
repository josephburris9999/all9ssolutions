'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getDefaultExpandedPortalAdminSections,
  isPortalAdminNavLinkActive,
  PORTAL_ADMIN_NAV,
  portalAdminNavSectionHasActiveChild,
  type PortalAdminClientCategoryCounts,
  type PortalAdminNavSection,
} from '@/lib/portal-admin-nav';
import type { PortalAdminUnreadMessagesState } from '@/contexts/portal-admin-unread-messages-context';

type PortalAdminNavProps = {
  className?: string;
  collapsed?: boolean;
  pendingExpandSectionId?: string | null;
  clientCategoryCounts?: PortalAdminClientCategoryCounts;
  unreadMessages?: PortalAdminUnreadMessagesState;
  onRequestExpand?: (sectionId?: string) => void;
  onPendingExpandHandled?: () => void;
  onNavigate?: () => void;
};

function formatNavBadgeCount(count: number): string {
  return count > 99 ? '99+' : String(count);
}

function NavCountBadge({
  count,
  active,
  alert = false,
}: {
  count: number;
  active?: boolean;
  alert?: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-flex min-w-[1.25rem] shrink-0 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums leading-none',
        alert
          ? 'bg-destructive text-destructive-foreground'
          : active
            ? 'bg-primary/25 text-primary'
            : 'bg-primary/15 text-primary'
      )}
    >
      {formatNavBadgeCount(count)}
    </span>
  );
}

function isPortalAdminUnreadMessageLinkActive(pathname: string, href: string): boolean {
  const basePath = href.split('#')[0]?.split('?')[0] ?? href;
  return pathname === basePath;
}

function NavLink({
  href,
  label,
  disabled,
  active,
  collapsed,
  badgeCount,
  alert = false,
  onNavigate,
}: {
  href: string;
  label: string;
  disabled?: boolean;
  active: boolean;
  collapsed?: boolean;
  badgeCount?: number;
  alert?: boolean;
  onNavigate?: () => void;
}) {
  const badgeLabel = badgeCount != null ? formatNavBadgeCount(badgeCount) : null;

  if (disabled) {
    return (
      <span
        title={collapsed ? label : undefined}
        className={cn(
          'flex items-center rounded-md text-sm text-muted-foreground/60',
          collapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2'
        )}
        aria-disabled="true"
      >
        {collapsed ? (
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" aria-hidden />
        ) : (
          <>
            {label}
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Soon
            </span>
          </>
        )}
      </span>
    );
  }

  return (
    <Link
      href={href}
      title={collapsed ? (badgeLabel ? `${label} (${badgeLabel})` : label) : undefined}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      aria-label={collapsed ? (badgeLabel ? `${label}, ${badgeLabel} clients` : label) : undefined}
      className={cn(
        'block rounded-md text-sm transition-colors',
        collapsed ? 'px-2 py-2.5 text-center' : 'px-3 py-2',
        alert
          ? 'bg-destructive/15 font-medium text-destructive hover:bg-destructive/20'
          : active
            ? 'bg-primary/10 font-medium text-primary'
            : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
      )}
    >
      {collapsed ? (
        <span className="mx-auto block h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      ) : (
        <span className="flex items-center justify-between gap-2">
          <span>{label}</span>
          {badgeCount != null ? <NavCountBadge count={badgeCount} active={active} alert={alert} /> : null}
        </span>
      )}
    </Link>
  );
}

function NavSection({
  section,
  pathname,
  expanded,
  collapsed,
  clientCategoryCounts,
  unreadMessages,
  onToggle,
  onRequestExpand,
  onNavigate,
}: {
  section: PortalAdminNavSection;
  pathname: string;
  expanded: boolean;
  collapsed?: boolean;
  clientCategoryCounts?: PortalAdminClientCategoryCounts;
  unreadMessages?: PortalAdminUnreadMessagesState;
  onToggle: () => void;
  onRequestExpand?: (sectionId?: string) => void;
  onNavigate?: () => void;
}) {
  const Icon = section.icon;
  const hasChildren = Boolean(section.children?.length);
  const sectionActive =
    portalAdminNavSectionHasActiveChild(pathname, section) ||
    (section.id === 'communication' &&
      (unreadMessages?.projects.some((project) =>
        isPortalAdminUnreadMessageLinkActive(pathname, project.href)
      ) ??
        false));
  const hasUnviewedClientMessages =
    section.id === 'communication' && Boolean(unreadMessages?.hasUnviewed);
  const communicationAlertClassName = hasUnviewedClientMessages
    ? 'bg-destructive/15 text-destructive hover:bg-destructive/20'
    : undefined;

  if (!hasChildren && section.href) {
    const active = isPortalAdminNavLinkActive(pathname, section.href);

    return (
      <Link
        href={section.href}
        title={section.label}
        onClick={onNavigate}
        aria-current={active ? 'page' : undefined}
        aria-label={collapsed ? section.label : undefined}
        className={cn(
          'flex items-center rounded-lg text-sm font-medium transition-colors',
          collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5',
          active
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
        )}
      >
        <Icon className="h-4 w-4 shrink-0" aria-hidden />
        {!collapsed ? section.label : null}
      </Link>
    );
  }

  if (collapsed) {
    return (
      <button
        type="button"
        title={section.label}
        aria-label={section.label}
        aria-expanded={expanded}
        onClick={() => onRequestExpand?.(section.id)}
        className={cn(
          'flex w-full items-center justify-center rounded-lg px-2 py-2.5 text-sm font-medium transition-colors',
          communicationAlertClassName ??
            (sectionActive
              ? 'bg-secondary/40 text-foreground'
              : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground')
        )}
      >
        <Icon className="h-4 w-4 shrink-0" aria-hidden />
      </button>
    );
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={onToggle}
        className={cn(
          'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors',
          communicationAlertClassName ??
            (sectionActive
              ? 'bg-secondary/40 text-foreground'
              : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground')
        )}
      >
        <Icon className="h-4 w-4 shrink-0" aria-hidden />
        <span className="min-w-0 flex-1 truncate">{section.label}</span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', expanded && 'rotate-180')}
          aria-hidden
        />
      </button>

      {expanded && section.children ? (
        <div className="ml-4 space-y-0.5 border-l border-border pl-3">
          {section.id === 'communication' && unreadMessages?.projects.length
            ? unreadMessages.projects.map((project) => (
                <NavLink
                  key={project.projectId}
                  href={project.href}
                  label={`${project.clientName} — ${project.projectTitle}`}
                  active={isPortalAdminUnreadMessageLinkActive(pathname, project.href)}
                  badgeCount={project.unviewedCount}
                  alert
                  onNavigate={onNavigate}
                />
              ))
            : null}
          {section.children.map((child) => {
            const badgeCount =
              section.id === 'clients' && clientCategoryCounts && child.id in clientCategoryCounts
                ? clientCategoryCounts[child.id as keyof PortalAdminClientCategoryCounts]
                : undefined;

            return (
              <NavLink
                key={child.id}
                href={child.href}
                label={child.label}
                disabled={child.disabled}
                active={isPortalAdminNavLinkActive(pathname, child.href)}
                badgeCount={badgeCount}
                onNavigate={onNavigate}
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function PortalAdminNav({
  className,
  collapsed = false,
  pendingExpandSectionId,
  clientCategoryCounts,
  unreadMessages,
  onRequestExpand,
  onPendingExpandHandled,
  onNavigate,
}: PortalAdminNavProps) {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = React.useState<string[]>(() =>
    getDefaultExpandedPortalAdminSections(pathname)
  );

  React.useEffect(() => {
    setExpandedSections((current) => {
      const activeSections = getDefaultExpandedPortalAdminSections(pathname);
      const merged = new Set([...current, ...activeSections]);
      return Array.from(merged);
    });
  }, [pathname]);

  React.useEffect(() => {
    if (!pendingExpandSectionId) {
      return;
    }

    setExpandedSections((current) =>
      current.includes(pendingExpandSectionId) ? current : [...current, pendingExpandSectionId]
    );
    onPendingExpandHandled?.();
  }, [pendingExpandSectionId, onPendingExpandHandled]);

  React.useEffect(() => {
    if (!unreadMessages?.hasUnviewed) {
      return;
    }

    setExpandedSections((current) =>
      current.includes('communication') ? current : [...current, 'communication']
    );
  }, [unreadMessages?.hasUnviewed]);

  function toggleSection(sectionId: string) {
    setExpandedSections((current) =>
      current.includes(sectionId) ? current.filter((id) => id !== sectionId) : [...current, sectionId]
    );
  }

  return (
    <nav className={cn('space-y-1', className)} aria-label="Admin portal">
      {PORTAL_ADMIN_NAV.map((section) => (
        <NavSection
          key={section.id}
          section={section}
          pathname={pathname}
          expanded={expandedSections.includes(section.id)}
          collapsed={collapsed}
          clientCategoryCounts={clientCategoryCounts}
          unreadMessages={unreadMessages}
          onToggle={() => toggleSection(section.id)}
          onRequestExpand={onRequestExpand}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
}

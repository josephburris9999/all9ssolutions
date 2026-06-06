import type { LucideIcon } from 'lucide-react';
import {
  CreditCard,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Users,
} from 'lucide-react';

export type PortalAdminClientCategoryCounts = {
  consultations: number;
  current: number;
  completed: number;
};

export type { PortalAdminUnreadMessageProject } from '@/lib/portal-admin-unread-messages';

export type PortalAdminNavLink = {
  id: string;
  label: string;
  href: string;
  disabled?: boolean;
};

export type PortalAdminNavSection = {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  children?: PortalAdminNavLink[];
};

export const PORTAL_ADMIN_NAV: PortalAdminNavSection[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: LayoutDashboard,
    href: '/portal/admin',
  },
  {
    id: 'clients',
    label: 'Clients',
    icon: Users,
    children: [
      {
        id: 'consultations',
        label: 'Consultations',
        href: '/portal/admin/clients/consultations',
      },
      { id: 'current', label: 'Current', href: '/portal/admin/clients/current' },
      { id: 'completed', label: 'Completed', href: '/portal/admin/clients/completed' },
    ],
  },
  {
    id: 'communication',
    label: 'Communication',
    icon: MessageSquare,
    children: [
      { id: 'messages', label: 'Client messages', href: '/portal/admin/messages', disabled: true },
      { id: 'support', label: 'Support queue', href: '/portal/admin/support', disabled: true },
    ],
  },
  {
    id: 'billing',
    label: 'Billing',
    icon: CreditCard,
    children: [
      { id: 'invoices', label: 'Invoices', href: '/portal/admin/invoices', disabled: true },
      { id: 'payments', label: 'Payments', href: '/portal/admin/payments', disabled: true },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    children: [
      { id: 'portal-settings', label: 'Portal settings', href: '/portal/admin/settings', disabled: true },
    ],
  },
];

export function isPortalAdminNavLinkActive(pathname: string, href: string): boolean {
  if (href === '/portal/admin') {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function portalAdminNavSectionHasActiveChild(pathname: string, section: PortalAdminNavSection): boolean {
  if (section.href && isPortalAdminNavLinkActive(pathname, section.href)) {
    return true;
  }

  return section.children?.some((child) => isPortalAdminNavLinkActive(pathname, child.href)) ?? false;
}

export function getDefaultExpandedPortalAdminSections(pathname: string): string[] {
  return PORTAL_ADMIN_NAV.filter((section) => section.children && portalAdminNavSectionHasActiveChild(pathname, section)).map(
    (section) => section.id
  );
}

import { redirect } from 'next/navigation';
import { PortalAdminShell } from '@/components/portal-admin-shell';
import { PortalDashboardSession } from '@/components/portal-dashboard-session';
import { getPortalAdminClientCategoryCounts } from '@/lib/portal-admin-consultations';
import { getPortalAdminUnreadMessageProjects } from '@/lib/portal-admin-unread-messages';
import { getPortalSession } from '@/lib/portal-auth';
import { isPortalAdminRole, PORTAL_CLIENT_DASHBOARD_PATH } from '@/lib/portal-role-data';

export const dynamic = 'force-dynamic';

export default async function PortalAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getPortalSession();

  if (!session) {
    redirect('/portal');
  }

  if (session.mustChangePassword) {
    redirect('/portal');
  }

  if (!isPortalAdminRole(session.role)) {
    redirect(PORTAL_CLIENT_DASHBOARD_PATH);
  }

  const [clientCategoryCounts, unreadMessageProjects] = await Promise.all([
    getPortalAdminClientCategoryCounts(),
    getPortalAdminUnreadMessageProjects(),
  ]);

  const initialUnreadMessages = {
    hasUnviewed: unreadMessageProjects.length > 0,
    projects: unreadMessageProjects,
  };

  return (
    <>
      <PortalDashboardSession />
      <PortalAdminShell
        clientCategoryCounts={clientCategoryCounts}
        initialUnreadMessages={initialUnreadMessages}
      >
        {children}
      </PortalAdminShell>
    </>
  );
}

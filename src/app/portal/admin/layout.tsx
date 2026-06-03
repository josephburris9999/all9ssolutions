import { redirect } from 'next/navigation';
import { PortalAdminShell } from '@/components/portal-admin-shell';
import { PortalDashboardSession } from '@/components/portal-dashboard-session';
import { getPortalAdminClientCategoryCounts } from '@/lib/portal-admin-consultations';
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

  const clientCategoryCounts = await getPortalAdminClientCategoryCounts();

  return (
    <>
      <PortalDashboardSession />
      <PortalAdminShell clientCategoryCounts={clientCategoryCounts}>{children}</PortalAdminShell>
    </>
  );
}

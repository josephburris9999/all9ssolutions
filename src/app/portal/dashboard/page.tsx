import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { PortalDashboardSession } from '@/components/portal-dashboard-session';
import { PortalProjectDashboardLoader } from '@/components/portal-project-dashboard-loader';
import { getPortalSession } from '@/lib/portal-auth';
import { ensureClientPortalAccess } from '@/lib/portal-client-access';
import { isPortalAdminRole, PORTAL_ADMIN_PATH, PORTAL_CLIENT_DASHBOARD_PATH } from '@/lib/portal-role-data';

export const metadata: Metadata = {
  title: 'Client Projects | all9s Solutions',
  description: 'Signed-in client projects portal for all9s Solutions.',
};

type PortalDashboardPageProps = {
  searchParams: Promise<{ project?: string }>;
};

export default async function PortalDashboardPage({ searchParams }: PortalDashboardPageProps) {
  const session = await getPortalSession();

  if (!session) {
    redirect('/portal');
  }

  if (isPortalAdminRole(session.role)) {
    redirect(PORTAL_ADMIN_PATH);
  }

  await ensureClientPortalAccess(session);

  const { project: selectedProjectId } = await searchParams;

  return (
    <main className="min-h-screen">
      <PortalDashboardSession />
      <PortalProjectDashboardLoader
        portalUserId={session.userId}
        basePath={PORTAL_CLIENT_DASHBOARD_PATH}
        selectedProjectId={selectedProjectId}
        mustChangePassword={session.mustChangePassword}
        dashboardContext={{
          email: session.email,
          name: 'Client',
          company: null,
          phone: null,
          timezone: null,
        }}
        pickerTitle="Your projects"
        pickerDescription="You have more than one active project. Select one to open its portal dashboard."
      />
    </main>
  );
}

import { redirect } from 'next/navigation';
import { PortalAdminConsultationClientView } from '@/components/portal-admin-consultation-client-view';
import { PortalClientDashboard } from '@/components/portal-client-dashboard';
import { PortalNoProjectsMessage } from '@/components/portal-no-projects-message';
import { PortalProjectPicker } from '@/components/portal-project-picker';
import type {
  PortalAdminConsultationClientDetail,
  PortalAdminConsultationDetail,
} from '@/lib/portal-admin-client-display';
import { loadPortalDashboardView } from '@/lib/portal-dashboard-data';
import { getPortalAdminSignedInDisplayName } from '@/lib/portal-admin-session-display';
import {
  listSelectablePortalProjects,
  portalProjectDashboardHref,
  resolvePortalProjectGate,
} from '@/lib/portal-projects';

type PortalAdminClientPortalViewProps = {
  client: PortalAdminConsultationDetail | PortalAdminConsultationClientDetail;
  basePath: string;
  selectedProjectId?: string | null;
  heroTitle?: string;
  heroIdentityPrefix?: string;
  allowCreatePortalAccount?: boolean;
  showConsultationRequestsSection?: boolean;
};

function isConsultationClientDetail(
  client: PortalAdminConsultationDetail | PortalAdminConsultationClientDetail
): client is PortalAdminConsultationClientDetail {
  return 'requests' in client && 'clientKey' in client;
}

export async function PortalAdminClientPortalView({
  client,
  basePath,
  selectedProjectId,
  heroTitle,
  heroIdentityPrefix,
  allowCreatePortalAccount = false,
  showConsultationRequestsSection = false,
}: PortalAdminClientPortalViewProps) {
  const adminDisplayName = await getPortalAdminSignedInDisplayName();

  const consultationClient = isConsultationClientDetail(client) ? client : null;

  if (showConsultationRequestsSection && consultationClient) {
    return <PortalAdminConsultationClientView client={consultationClient} />;
  }

  const primaryConsultationRequestId = isConsultationClientDetail(client)
    ? client.primaryConsultationRequestId
    : client.id;

  const dashboardContext = {
    portalUserId: client.portalUserId,
    email: client.email,
    name: client.name,
    company: client.company,
    phone: client.phone,
    timezone: client.timezone,
    preferredContact: client.preferredContact,
    message: client.message,
    submittedAt: client.createdAt,
  };

  const dashboardExtras = {
    consultationRequestId: primaryConsultationRequestId,
    allowCreatePortalAccount,
    heroTitle,
    heroIdentityPrefix,
    heroIdentityName: adminDisplayName,
  };

  if (!client.portalUserId) {
    const dashboard = await loadPortalDashboardView(dashboardContext);
    return (
      <PortalClientDashboard {...dashboard} {...dashboardExtras} heroIdentityName={adminDisplayName} />
    );
  }

  const projects = await listSelectablePortalProjects(client.portalUserId);

  if (projects.length === 0) {
    const dashboard = await loadPortalDashboardView(dashboardContext);
    return (
      <PortalClientDashboard {...dashboard} {...dashboardExtras} heroIdentityName={adminDisplayName} />
    );
  }

  const gate = resolvePortalProjectGate(projects, selectedProjectId);

  if (gate.kind === 'redirect') {
    redirect(portalProjectDashboardHref(basePath, gate.projectId));
  }

  if (gate.kind === 'picker') {
    return (
      <PortalProjectPicker
        projects={projects}
        basePath={basePath}
        signedInDisplayName={adminDisplayName}
        title="Select a project"
        description={`Choose which project to view for ${client.name.trim() || 'this client'}.`}
      />
    );
  }

  if (gate.kind === 'none') {
    return <PortalNoProjectsMessage />;
  }

  if (gate.kind !== 'ready') {
    return <PortalNoProjectsMessage />;
  }

  const selectedProject = gate.project;

  const dashboard = await loadPortalDashboardView(
    {
      ...dashboardContext,
      projectId: selectedProject.id,
    },
    {
      selectedProject,
    }
  );

  return (
    <PortalClientDashboard
      {...dashboard}
      {...dashboardExtras}
      consultationRequestId={selectedProject.consultationRequestId}
      adminProjectWorkspace={{
        projectId: selectedProject.id,
        projectStatus: selectedProject.status,
      }}
      heroIdentityName={adminDisplayName}
    />
  );
}

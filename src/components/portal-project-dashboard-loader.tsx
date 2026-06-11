import { PortalClientDashboard } from '@/components/portal-client-dashboard';
import { PortalNoProjectsMessage } from '@/components/portal-no-projects-message';
import {
  loadPortalClientProjectDashboardView,
  loadPortalClientProjectsLandingView,
} from '@/lib/portal-client-dashboard-data';
import {
  listClientPortalProjects,
  resolvePortalClientProjectGate,
} from '@/lib/portal-projects';

type PortalProjectDashboardLoaderProps = {
  portalUserId: string;
  basePath: string;
  selectedProjectId?: string | null;
  dashboardContext: Omit<
    Parameters<typeof loadPortalClientProjectDashboardView>[0],
    'portalUserId' | 'projectId'
  >;
  pickerTitle?: string;
  pickerDescription?: string;
  heroTitle?: string;
  heroIdentityPrefix?: string;
  consultationRequestId?: string;
  allowCreatePortalAccount?: boolean;
  mustChangePassword?: boolean;
};

export async function PortalProjectDashboardLoader({
  portalUserId,
  basePath,
  selectedProjectId,
  dashboardContext,
  heroTitle,
  heroIdentityPrefix,
  consultationRequestId,
  allowCreatePortalAccount = false,
  mustChangePassword = false,
}: PortalProjectDashboardLoaderProps) {
  const projects = await listClientPortalProjects(portalUserId);
  const gate = resolvePortalClientProjectGate(projects, selectedProjectId);
  const activeProjectIds = new Set(projects.map((project) => project.id));

  if (gate.kind === 'none') {
    return <PortalNoProjectsMessage />;
  }

  const linkedProjectsForRequests = projects.map((project) => ({
    id: project.id,
    title: project.title,
    consultationRequestId: project.consultationRequestId,
  }));

  if (gate.kind === 'landing') {
    const landing = await loadPortalClientProjectsLandingView({
      ...dashboardContext,
      portalUserId,
    });

    return (
      <PortalClientDashboard
        {...landing}
        allowCreatePortalAccount={allowCreatePortalAccount}
        showClientConsultationRequests
        showPasswordChangeButton
        mustChangePassword={mustChangePassword}
        linkedProjectsForRequests={linkedProjectsForRequests}
        activeProjectIds={activeProjectIds}
        heroTitle={heroTitle}
        heroIdentityPrefix={heroIdentityPrefix}
      />
    );
  }

  if (gate.kind !== 'ready') {
    return <PortalNoProjectsMessage />;
  }

  const selectedProject = gate.project;
  const activeConsultationId = consultationRequestId ?? selectedProject.consultationRequestId;

  const dashboard = await loadPortalClientProjectDashboardView(
    {
      ...dashboardContext,
      portalUserId,
      projectId: selectedProject.id,
    },
    {
      selectedProject,
    }
  );

  return (
    <PortalClientDashboard
      {...dashboard}
      consultationRequestId={activeConsultationId}
      allowCreatePortalAccount={allowCreatePortalAccount}
      showClientConsultationRequests
      showClientProjectWorkspace
      showPasswordChangeButton
      mustChangePassword={mustChangePassword}
      linkedProjectsForRequests={linkedProjectsForRequests}
      activeProjectIds={activeProjectIds}
      heroTitle={heroTitle}
      heroIdentityPrefix={heroIdentityPrefix}
    />
  );
}

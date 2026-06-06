import { PortalClientDashboard } from '@/components/portal-client-dashboard';
import { PortalNoProjectsMessage } from '@/components/portal-no-projects-message';
import {
  loadPortalClientProjectDashboardView,
  loadPortalClientProjectsLandingView,
} from '@/lib/portal-client-dashboard-data';
import {
  listSelectablePortalProjects,
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
  const projects = await listSelectablePortalProjects(portalUserId);
  const gate = resolvePortalClientProjectGate(projects, selectedProjectId);

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
        heroTitle={heroTitle}
        heroIdentityPrefix={heroIdentityPrefix}
      />
    );
  }

  const activeConsultationId = consultationRequestId ?? gate.project.consultationRequestId;

  const dashboard = await loadPortalClientProjectDashboardView(
    {
      ...dashboardContext,
      portalUserId,
      projectId: gate.project.id,
    },
    {
      selectedProject: gate.project,
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
      heroTitle={heroTitle}
      heroIdentityPrefix={heroIdentityPrefix}
    />
  );
}

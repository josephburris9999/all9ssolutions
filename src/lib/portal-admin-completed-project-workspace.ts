import 'server-only';

import { getPortalAdminCompletedClientById } from '@/lib/portal-admin-consultations';
import { getPortalAmountSummary } from '@/lib/portal-amount-due';
import { getPortalContentUploads } from '@/lib/portal-content-upload';
import { loadPortalDashboardView, type PortalDashboardView } from '@/lib/portal-dashboard-data';
import { listSelectablePortalProjects } from '@/lib/portal-projects';
import { getPortalSupportThread } from '@/lib/portal-support';
import { getPortalProjectTimelines } from '@/lib/portal-timeline';

export type PortalAdminCompletedProjectWorkspace = {
  dashboard: PortalDashboardView;
  consultationRequestId: string;
  projectId: string;
  projectTitle: string;
  projectStatus: string;
};

function resolveCompletedProjectForConsultation(
  projects: Awaited<ReturnType<typeof listSelectablePortalProjects>>,
  consultationRequestId: string,
  selectedProjectId?: string | null
) {
  const completedForConsultation = projects.filter(
    (entry) =>
      entry.consultationRequestId === consultationRequestId && entry.status === 'COMPLETED'
  );

  if (completedForConsultation.length === 0) {
    return null;
  }

  if (selectedProjectId) {
    return completedForConsultation.find((entry) => entry.id === selectedProjectId) ?? null;
  }

  return completedForConsultation[0] ?? null;
}

/** Admin Completed list workspace: read-only review of a finished client project. */
export async function loadPortalAdminCompletedProjectWorkspace(
  consultationRequestId: string,
  selectedProjectId?: string | null
): Promise<PortalAdminCompletedProjectWorkspace | null> {
  const client = await getPortalAdminCompletedClientById(consultationRequestId);
  if (!client?.portalUserId) {
    return null;
  }

  const projects = await listSelectablePortalProjects(client.portalUserId);
  const project = resolveCompletedProjectForConsultation(
    projects,
    consultationRequestId,
    selectedProjectId
  );

  if (!project) {
    return null;
  }

  const context = {
    portalUserId: client.portalUserId,
    email: client.email,
    name: client.name,
    company: client.company,
    phone: client.phone,
    timezone: client.timezone,
    preferredContact: client.preferredContact,
    message: client.message,
    submittedAt: client.createdAt,
    projectId: project.id,
  };

  const dashboard = await loadPortalDashboardView(context, { selectedProject: project });

  const [projectTimelines, amountSummary, supportThread, contentUploads] = await Promise.all([
    getPortalProjectTimelines(client.portalUserId, dashboard.clientTimezone, project.id),
    getPortalAmountSummary(client.portalUserId, project.id),
    getPortalSupportThread(client.portalUserId, project.id),
    getPortalContentUploads(client.portalUserId, project.id),
  ]);

  return {
    dashboard: {
      ...dashboard,
      projectTimelines,
      amountSummary,
      supportThread,
      contentUploads,
    },
    consultationRequestId,
    projectId: project.id,
    projectTitle: project.title.trim() || 'Untitled project',
    projectStatus: project.status,
  };
}

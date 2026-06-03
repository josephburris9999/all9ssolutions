import 'server-only';

import { getPortalAdminCurrentClientById } from '@/lib/portal-admin-consultations';
import { getPortalAmountSummary } from '@/lib/portal-amount-due';
import { getPortalContentUploads } from '@/lib/portal-content-upload';
import { loadPortalDashboardView, type PortalDashboardView } from '@/lib/portal-dashboard-data';
import { listSelectablePortalProjects } from '@/lib/portal-projects';
import { getPortalSupportThread } from '@/lib/portal-support';
import { getPortalProjectTimelines } from '@/lib/portal-timeline';

export type PortalAdminCurrentProjectWorkspace = {
  dashboard: PortalDashboardView;
  consultationRequestId: string;
  projectId: string;
  projectTitle: string;
};

export async function loadPortalAdminCurrentProjectWorkspace(
  consultationRequestId: string
): Promise<PortalAdminCurrentProjectWorkspace | null> {
  const client = await getPortalAdminCurrentClientById(consultationRequestId);
  if (!client?.portalUserId) {
    return null;
  }

  const projects = await listSelectablePortalProjects(client.portalUserId);
  const project = projects.find((entry) => entry.consultationRequestId === consultationRequestId);
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

  let fullDashboard = dashboard;

  if (!dashboard.agreementStatus.signed) {
    const [projectTimelines, amountSummary, supportThread, contentUploads] = await Promise.all([
      getPortalProjectTimelines(client.portalUserId, dashboard.clientTimezone, project.id),
      getPortalAmountSummary(client.portalUserId, project.id),
      getPortalSupportThread(client.portalUserId, project.id),
      getPortalContentUploads(client.portalUserId, project.id),
    ]);

    fullDashboard = {
      ...dashboard,
      projectTimelines,
      amountSummary,
      supportThread,
      contentUploads,
    };
  }

  return {
    dashboard: fullDashboard,
    consultationRequestId,
    projectId: project.id,
    projectTitle: project.title.trim() || 'Untitled project',
  };
}

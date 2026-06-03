import 'server-only';

import type { PortalDashboardView } from '@/lib/portal-dashboard-data';
import {
  loadPortalDashboardView,
  type PortalDashboardClientContext,
} from '@/lib/portal-dashboard-data';

export { loadPortalClientProjectsLandingView } from '@/lib/portal-dashboard-data';
import {
  areAllPortalAgreementsSigned,
  type PortalAgreementListItem,
} from '@/lib/portal-agreement-data';
import { PORTAL_AGREEMENT_VERSION, type PortalAgreementStatus } from '@/lib/portal-agreement';
import { listConsultationRequestsForPortalUser } from '@/lib/portal-consultation-requests';
import { getPortalAmountSummary } from '@/lib/portal-amount-due';
import { getPortalContentUploads } from '@/lib/portal-content-upload';
import type { PortalProjectOption } from '@/lib/portal-projects';
import { listPortalAgreementsForClientProject } from '@/lib/project-agreement-store';
import { getPortalProjectTimelines } from '@/lib/portal-timeline';
import { getPortalSupportThread } from '@/lib/portal-support';
import {
  getClientAgreementTimeZone,
  getPortalClientProfile,
} from '@/lib/portal-user';

function buildAgreementStatusFromList(agreements: PortalAgreementListItem[]): PortalAgreementStatus {
  const allSigned = areAllPortalAgreementsSigned(agreements);
  const lastSigned = [...agreements].reverse().find((item) => item.status.signed);

  return {
    signed: allSigned,
    signerName: lastSigned?.status.signerName ?? null,
    signedAt: lastSigned?.status.signedAt ?? null,
    agreementVersion: lastSigned?.status.agreementVersion ?? null,
    currentVersion:
      lastSigned?.status.currentVersion ??
      agreements[0]?.status.currentVersion ??
      PORTAL_AGREEMENT_VERSION,
  };
}

/**
 * Client portal only: load dashboard sections scoped to the selected project.
 * Independent of admin portal preview (`loadPortalDashboardView`).
 */
export async function loadPortalClientProjectDashboardView(
  context: PortalDashboardClientContext & { portalUserId: string; projectId: string },
  options: {
    selectedProject: PortalProjectOption;
    projectPickerHref: string | null;
  }
): Promise<PortalDashboardView> {
  const base = await loadPortalDashboardView(
    {
      ...context,
      portalUserId: context.portalUserId,
      projectId: context.projectId,
    },
    {
      selectedProject: options.selectedProject,
      projectPickerHref: options.projectPickerHref,
    }
  );

  const portalUserId = context.portalUserId;
  const projectId = context.projectId;
  const clientEmail = context.email.trim();

  const [agreements, clientTimezone, consultationRequests, clientProfile] = await Promise.all([
    listPortalAgreementsForClientProject(portalUserId, projectId),
    getClientAgreementTimeZone(portalUserId),
    listConsultationRequestsForPortalUser(portalUserId),
    getPortalClientProfile(portalUserId, clientEmail),
  ]);

  const agreementStatus = buildAgreementStatusFromList(agreements);

  const [projectTimelines, amountSummary, supportThread, contentUploads] = await Promise.all([
    getPortalProjectTimelines(portalUserId, clientTimezone, projectId),
    getPortalAmountSummary(portalUserId, projectId),
    getPortalSupportThread(portalUserId, projectId),
    getPortalContentUploads(portalUserId, projectId),
  ]);

  return {
    ...base,
    clientProfile,
    agreements,
    agreementStatus,
    projectTimelines,
    amountSummary,
    supportThread,
    contentUploads,
    consultationRequests,
    heroInfo: {
      ...base.heroInfo,
      agreementSigned: agreementStatus.signed,
    },
  };
}

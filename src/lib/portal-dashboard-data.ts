import 'server-only';

import {
  type PortalClientHeroInfo,
} from '@/lib/portal-admin-client-display';
import {
  buildPortalAgreementStatus,
  PORTAL_AGREEMENT_VERSION,
  type PortalAgreementStatus,
} from '@/lib/portal-agreement';
import {
  areAllPortalAgreementsSigned,
  type PortalAgreementListItem,
} from '@/lib/portal-agreement-data';
import type { PortalConsultationRequestDetail } from '@/lib/portal-consultation-requests-data';
import { listConsultationRequestsForPortalUser } from '@/lib/portal-consultation-requests';
import type { PortalProjectOption } from '@/lib/portal-projects';
import { listPortalAgreementsForUser } from '@/lib/project-agreement-store';
import { getPortalAmountSummary } from '@/lib/portal-amount-due';
import type { PortalAmountSummary } from '@/lib/portal-amount-due-data';
import { prisma } from '@/lib/prisma';
import { getPortalProjectTimelines } from '@/lib/portal-timeline';
import type { PortalProjectTimelineData } from '@/lib/portal-timeline-data';
import { getPortalContentUploads } from '@/lib/portal-content-upload';
import type { PortalContentUploadItem } from '@/lib/portal-content-upload-data';
import { getPortalSupportThread, type PortalSupportThread } from '@/lib/portal-support';
import { isPortalAdminRole } from '@/lib/portal-role-data';
import {
  getClientAgreementTimeZone,
  getPortalClientProfile,
  normalizePortalEmail,
  type PortalClientProfile,
} from '@/lib/portal-user';
import { isValidIanaTimeZone } from '@/lib/timezones';

export type PortalDashboardClientContext = {
  portalUserId: string | null;
  email: string;
  name: string;
  company: string | null;
  phone: string | null;
  timezone: string | null;
  preferredContact?: 'e' | 'p';
  message?: string;
  submittedAt?: string;
  /** When set, dashboard sections are scoped to this project. */
  projectId?: string | null;
};

export type PortalDashboardView = {
  clientName: string;
  clientProfile: PortalClientProfile;
  clientTimezone: string | null;
  selectedProject: PortalProjectOption | null;
  agreements: PortalAgreementListItem[];
  agreementStatus: PortalAgreementStatus;
  projectTimelines: PortalProjectTimelineData[];
  amountSummary: PortalAmountSummary;
  supportThread: PortalSupportThread;
  contentUploads: PortalContentUploadItem[];
  timelineReferenceNow: string;
  heroInfo: PortalClientHeroInfo;
  consultationRequests: PortalConsultationRequestDetail[];
};

const EMPTY_AMOUNT_SUMMARY: PortalAmountSummary = {
  depositAmount: 0,
  amountDue: 0,
  paidAmount: 0,
  lineItems: [],
};

const EMPTY_SUPPORT_THREAD: PortalSupportThread = {
  progressId: null,
  messages: [],
};

const EMPTY_CONTENT_UPLOADS: PortalContentUploadItem[] = [];

function consultationTimezone(timezone: string | null): string | null {
  const trimmed = timezone?.trim();
  return trimmed && isValidIanaTimeZone(trimmed) ? trimmed : null;
}

function consultationProfile(context: PortalDashboardClientContext): PortalClientProfile {
  return {
    name: context.name.trim(),
    email: context.email.trim(),
    company: context.company?.trim() || null,
    phone: context.phone?.trim() || null,
    timezone: consultationTimezone(context.timezone),
    preferredContact: context.preferredContact ?? null,
  };
}

function hasConsultationContext(context: PortalDashboardClientContext): boolean {
  return (
    context.message != null &&
    context.submittedAt != null &&
    context.preferredContact != null
  );
}

function normalizePreferredContact(value: string): 'e' | 'p' {
  return value === 'p' ? 'p' : 'e';
}

type ConsultationHeroSource = {
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  preferredContact: 'e' | 'p';
  timezone: string | null;
  message: string;
  submittedAt: string;
  portalUserId: string | null;
};

async function resolveConsultationHeroSource(
  context: PortalDashboardClientContext
): Promise<ConsultationHeroSource> {
  if (context.projectId && context.portalUserId) {
    const project = await prisma.project.findFirst({
      where: { id: context.projectId, portalUserId: context.portalUserId },
      select: {
        consultationRequest: {
          select: {
            name: true,
            email: true,
            company: true,
            phone: true,
            preferredContact: true,
            timezone: true,
            message: true,
            createdAt: true,
            portalUserId: true,
          },
        },
      },
    });

    const consultation = project?.consultationRequest;
    if (consultation) {
      return {
        name: consultation.name.trim(),
        email: consultation.email.trim(),
        company: consultation.company?.trim() || null,
        phone: consultation.phone?.trim() || null,
        preferredContact: normalizePreferredContact(consultation.preferredContact),
        timezone: consultation.timezone?.trim() || null,
        message: consultation.message.trim(),
        submittedAt: consultation.createdAt.toISOString(),
        portalUserId: consultation.portalUserId,
      };
    }
  }

  if (
    context.message != null &&
    context.submittedAt != null &&
    context.preferredContact != null
  ) {
    return {
      name: context.name.trim(),
      email: context.email.trim(),
      company: context.company?.trim() || null,
      phone: context.phone?.trim() || null,
      preferredContact: context.preferredContact,
      timezone: context.timezone?.trim() || null,
      message: context.message.trim(),
      submittedAt: context.submittedAt,
      portalUserId: context.portalUserId,
    };
  }

  const consultation = await prisma.consultationRequest.findFirst({
    where: context.portalUserId
      ? { portalUserId: context.portalUserId }
      : {
          email: {
            equals: normalizePortalEmail(context.email),
            mode: 'insensitive',
          },
        },
    orderBy: { createdAt: 'desc' },
    select: {
      name: true,
      email: true,
      company: true,
      phone: true,
      preferredContact: true,
      timezone: true,
      message: true,
      createdAt: true,
      portalUserId: true,
    },
  });

  if (!consultation) {
    return {
      name: context.name.trim(),
      email: context.email.trim(),
      company: context.company?.trim() || null,
      phone: context.phone?.trim() || null,
      preferredContact: context.preferredContact ?? 'e',
      timezone: context.timezone?.trim() || null,
      message: '',
      submittedAt: new Date().toISOString(),
      portalUserId: context.portalUserId,
    };
  }

  return {
    name: consultation.name.trim(),
    email: consultation.email.trim(),
    company: consultation.company?.trim() || null,
    phone: consultation.phone?.trim() || null,
    preferredContact: normalizePreferredContact(consultation.preferredContact),
    timezone: consultation.timezone?.trim() || null,
    message: consultation.message.trim(),
    submittedAt: consultation.createdAt.toISOString(),
    portalUserId: consultation.portalUserId,
  };
}

async function buildPortalClientHeroInfo(
  context: PortalDashboardClientContext,
  consultation: ConsultationHeroSource
): Promise<PortalClientHeroInfo> {
  const portalUserId = context.portalUserId ?? consultation.portalUserId;

  if (!portalUserId) {
    return {
      name: consultation.name,
      email: consultation.email,
      company: consultation.company,
      phone: consultation.phone,
      preferredContact: consultation.preferredContact,
      timezone: consultationTimezone(consultation.timezone),
      message: consultation.message,
      submittedAt: consultation.submittedAt,
      hasPortalAccount: false,
      agreementSigned: false,
      mustChangePassword: false,
    };
  }

  const portalUser = await prisma.portalUser.findUnique({
    where: { id: portalUserId },
    select: {
      role: true,
      mustChangePassword: true,
    },
  });

  const agreements = await listPortalAgreementsForUser(portalUserId, context.projectId ?? null);
  const allSigned = areAllPortalAgreementsSigned(agreements);
  const lastSigned = [...agreements].reverse().find((item) => item.status.signed);

  const hasPortalAccount = portalUser != null && !isPortalAdminRole(portalUser.role);
  const agreementStatus: PortalAgreementStatus = {
    signed: allSigned,
    signerName: lastSigned?.status.signerName ?? null,
    signedAt: lastSigned?.status.signedAt ?? null,
    agreementVersion: lastSigned?.status.agreementVersion ?? null,
    currentVersion:
      lastSigned?.status.currentVersion ??
      agreements[0]?.status.currentVersion ??
      PORTAL_AGREEMENT_VERSION,
  };

  return {
    name: consultation.name,
    email: consultation.email,
    company: consultation.company,
    phone: consultation.phone,
    preferredContact: consultation.preferredContact,
    timezone: consultationTimezone(consultation.timezone),
    message: consultation.message,
    submittedAt: consultation.submittedAt,
    hasPortalAccount,
    agreementSigned: allSigned,
    mustChangePassword: hasPortalAccount ? portalUser!.mustChangePassword : false,
  };
}

function unsignedAgreementView(
  context: PortalDashboardClientContext,
  heroInfo: PortalClientHeroInfo
): PortalDashboardView {
  const clientProfile = consultationProfile(context);

  return {
    clientName: clientProfile.name,
    clientProfile,
    clientTimezone: consultationTimezone(context.timezone),
    selectedProject: null,
    agreements: [],
    agreementStatus: buildPortalAgreementStatus(null),
    projectTimelines: [],
    amountSummary: EMPTY_AMOUNT_SUMMARY,
    supportThread: EMPTY_SUPPORT_THREAD,
    contentUploads: EMPTY_CONTENT_UPLOADS,
    timelineReferenceNow: new Date().toISOString(),
    heroInfo,
    consultationRequests: [],
  };
}

/**
 * Client portal landing (`/portal/dashboard` without `?project=`).
 * Does not load agreements, timeline, amounts, messages, or uploads.
 */
export async function loadPortalClientProjectsLandingView(
  context: PortalDashboardClientContext & { portalUserId: string }
): Promise<PortalDashboardView> {
  const portalUserId = context.portalUserId;
  const clientEmail = context.email.trim();

  const consultation = await resolveConsultationHeroSource({
    ...context,
    portalUserId,
    projectId: null,
  });

  const [clientProfile, clientTimezone, consultationRequests, portalUser] = await Promise.all([
    getPortalClientProfile(portalUserId, clientEmail),
    getClientAgreementTimeZone(portalUserId),
    listConsultationRequestsForPortalUser(portalUserId),
    prisma.portalUser.findUnique({
      where: { id: portalUserId },
      select: { role: true, mustChangePassword: true },
    }),
  ]);

  const hasPortalAccount = portalUser != null && !isPortalAdminRole(portalUser.role);

  const heroInfo: PortalClientHeroInfo = {
    name: consultation.name,
    email: consultation.email,
    company: consultation.company,
    phone: consultation.phone,
    preferredContact: consultation.preferredContact,
    timezone: consultationTimezone(consultation.timezone),
    message: consultation.message,
    submittedAt: consultation.submittedAt,
    hasPortalAccount,
    agreementSigned: false,
    mustChangePassword: hasPortalAccount ? portalUser!.mustChangePassword : false,
  };

  return {
    clientName: clientProfile.name,
    clientProfile,
    clientTimezone,
    selectedProject: null,
    agreements: [],
    agreementStatus: buildPortalAgreementStatus(null),
    projectTimelines: [],
    amountSummary: EMPTY_AMOUNT_SUMMARY,
    supportThread: EMPTY_SUPPORT_THREAD,
    contentUploads: EMPTY_CONTENT_UPLOADS,
    timelineReferenceNow: new Date().toISOString(),
    heroInfo,
    consultationRequests,
  };
}

export async function loadPortalDashboardView(
  context: PortalDashboardClientContext,
  options?: {
    selectedProject?: PortalProjectOption | null;
  }
): Promise<PortalDashboardView> {
  const consultation = await resolveConsultationHeroSource(context);
  const heroInfo = await buildPortalClientHeroInfo(context, consultation);

  if (!context.portalUserId) {
    return unsignedAgreementView(context, heroInfo);
  }

  const portalUserId = context.portalUserId;
  const clientEmail = context.email.trim();
  const useConsultationProfile = hasConsultationContext(context);
  const projectId = context.projectId ?? null;

  const [clientProfile, clientTimezone, agreements, consultationRequests] = await Promise.all([
    useConsultationProfile
      ? Promise.resolve(consultationProfile(context))
      : getPortalClientProfile(portalUserId, clientEmail),
    getClientAgreementTimeZone(portalUserId),
    listPortalAgreementsForUser(portalUserId, projectId),
    listConsultationRequestsForPortalUser(portalUserId),
  ]);

  const clientName = useConsultationProfile ? context.name.trim() : clientProfile.name;

  const allSigned = areAllPortalAgreementsSigned(agreements);
  const lastSigned = [...agreements].reverse().find((item) => item.status.signed);
  const agreementStatus: PortalAgreementStatus = {
    signed: allSigned,
    signerName: lastSigned?.status.signerName ?? null,
    signedAt: lastSigned?.status.signedAt ?? null,
    agreementVersion: lastSigned?.status.agreementVersion ?? null,
    currentVersion:
      lastSigned?.status.currentVersion ??
      agreements[0]?.status.currentVersion ??
      PORTAL_AGREEMENT_VERSION,
  };

  const [projectTimelines, amountSummary, supportThread, contentUploads] = allSigned
    ? await Promise.all([
        getPortalProjectTimelines(portalUserId, clientTimezone, projectId),
        getPortalAmountSummary(portalUserId, projectId),
        projectId ? getPortalSupportThread(portalUserId, projectId) : Promise.resolve(EMPTY_SUPPORT_THREAD),
        projectId ? getPortalContentUploads(portalUserId, projectId) : Promise.resolve(EMPTY_CONTENT_UPLOADS),
      ])
    : [[], EMPTY_AMOUNT_SUMMARY, EMPTY_SUPPORT_THREAD, EMPTY_CONTENT_UPLOADS];

  return {
    clientName,
    clientProfile,
    clientTimezone,
    selectedProject: options?.selectedProject ?? null,
    agreements,
    agreementStatus,
    projectTimelines,
    amountSummary,
    supportThread,
    contentUploads,
    timelineReferenceNow: new Date().toISOString(),
    heroInfo,
    consultationRequests,
  };
}

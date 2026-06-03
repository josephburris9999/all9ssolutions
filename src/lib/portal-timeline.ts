import 'server-only';

import { prisma } from '@/lib/prisma';
import {
  getDefaultTimelineEndIso,
  type PortalProjectTimelineData,
} from '@/lib/portal-timeline-data';

export type { PortalProjectTimelineData } from '@/lib/portal-timeline-data';

const ACTIVE_PROJECT_STATUSES = ['PLANNED', 'ACTIVE', 'ON_HOLD'] as const;

function buildTimelineEntry(
  id: string,
  title: string,
  consultationStartedAt: Date,
  estimatedCompletionAt: Date | null,
  timeZone: string
): PortalProjectTimelineData {
  const startIso = consultationStartedAt.toISOString();
  const completionIso = estimatedCompletionAt?.toISOString() ?? null;
  const endDateIsTbd = completionIso === null;
  const timelineEndAt =
    completionIso && estimatedCompletionAt!.getTime() > consultationStartedAt.getTime()
      ? completionIso
      : getDefaultTimelineEndIso(startIso);

  return {
    projectId: id,
    projectTitle: title,
    consultationStartedAt: startIso,
    estimatedCompletionAt: completionIso,
    timelineEndAt,
    endDateIsTbd,
    timeZone,
  };
}

export async function getPortalProjectTimelines(
  portalUserId: string,
  timeZone: string | null,
  projectId?: string | null
): Promise<PortalProjectTimelineData[]> {
  const tz = timeZone ?? 'UTC';

  const projectRows = await prisma.project.findMany({
    where: {
      portalUserId,
      ...(projectId
        ? { id: projectId }
        : { status: { in: [...ACTIVE_PROJECT_STATUSES] } }),
    },
    select: {
      id: true,
      title: true,
      consultationRequestId: true,
      estimatedCompletionAt: true,
      consultationRequest: { select: { createdAt: true } },
    },
  });

  const projects = projectRows
    .filter((project) => project.consultationRequestId != null && project.consultationRequest != null)
    .sort(
      (a, b) =>
        a.consultationRequest!.createdAt.getTime() - b.consultationRequest!.createdAt.getTime()
    );

  const linkedConsultationIds = projects
    .map((p) => p.consultationRequestId)
    .filter((id): id is string => id != null);

  const timelines: PortalProjectTimelineData[] = [];

  for (const project of projects) {
    const start = project.consultationRequest?.createdAt;
    if (!start) continue;

    timelines.push(
      buildTimelineEntry(project.id, project.title, start, project.estimatedCompletionAt, tz)
    );
  }

  if (projectId) {
    return timelines;
  }

  const orphanConsultations = await prisma.consultationRequest.findMany({
    where: {
      portalUserId,
      ...(linkedConsultationIds.length > 0 ? { id: { notIn: linkedConsultationIds } } : {}),
    },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      name: true,
      company: true,
      createdAt: true,
    },
  });

  for (const consultation of orphanConsultations) {
    const title = consultation.company?.trim() || consultation.name.trim() || 'Consultation';
    timelines.push(buildTimelineEntry(consultation.id, title, consultation.createdAt, null, tz));
  }

  return timelines;
}

/** @deprecated Use getPortalProjectTimelines — returns the first active project timeline if any. */
export async function getPortalProjectTimeline(
  portalUserId: string,
  timeZone: string | null
): Promise<PortalProjectTimelineData | null> {
  const timelines = await getPortalProjectTimelines(portalUserId, timeZone);
  return timelines[0] ?? null;
}

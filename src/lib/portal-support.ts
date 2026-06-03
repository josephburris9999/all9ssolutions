import 'server-only';

import { prisma } from '@/lib/prisma';
import type { PortalSupportMessage } from '@/lib/portal-support-data';

export type PortalSupportThread = {
  progressId: string | null;
  messages: PortalSupportMessage[];
};

export type PortalSupportMessageResult = {
  progressId: string;
  message: PortalSupportMessage;
};

const PORTAL_SUPPORT_PROGRESS_TITLE = 'Client messaging';

function mapMessage(message: {
  id: string;
  kind: 'REQUEST' | 'ANSWER';
  body: string;
  createdAt: Date;
}): PortalSupportMessage {
  return {
    id: message.id,
    kind: message.kind,
    body: message.body,
    createdAt: message.createdAt.toISOString(),
  };
}

async function getOrCreatePortalSupportProgress(portalUserId: string, projectId?: string | null) {
  if (!projectId) {
    throw new Error('Project is required');
  }

  // If scoped to a project, the project's portalUserId is the source of truth.
  // This prevents saving “mismatched” portalUserId values for project-scoped threads.
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { portalUserId: true },
  });

  if (!project) {
    // If we can't resolve the project owner, don't create an orphaned progress row.
    throw new Error('Project not found');
  }
  const resolvedPortalUserId = project.portalUserId;

  const existing = await prisma.progress.findFirst({
    where: {
      projectId,
      project: { portalUserId: resolvedPortalUserId },
      title: PORTAL_SUPPORT_PROGRESS_TITLE,
      status: { not: 'CLOSED' },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (existing) {
    return existing;
  }

  return prisma.progress.create({
    data: {
      projectId,
      title: PORTAL_SUPPORT_PROGRESS_TITLE,
      status: 'OPEN',
    },
  });
}

export async function getPortalSupportThread(
  portalUserId: string,
  projectId?: string | null
): Promise<PortalSupportThread> {
  if (!projectId) {
    return { progressId: null, messages: [] };
  }

  // If scoped to a project, the project's portalUserId is the source of truth.
  // This prevents looking up a progress row under the wrong portalUserId.
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { portalUserId: true },
  });

  if (!project) {
    return { progressId: null, messages: [] };
  }
  const resolvedPortalUserId = project.portalUserId;

  const progress = await prisma.progress.findFirst({
    where: {
      projectId,
      project: { portalUserId: resolvedPortalUserId },
      title: PORTAL_SUPPORT_PROGRESS_TITLE,
    },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  });

  if (!progress) {
    return { progressId: null, messages: [] };
  }

  const messages = await prisma.progressMessage.findMany({
    where: { progressId: progress.id },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      kind: true,
      body: true,
      createdAt: true,
    },
  });

  return {
    progressId: progress.id,
    messages: messages.map(mapMessage),
  };
}

/** @deprecated Use getPortalSupportThread */
export async function getPortalSupportMessages(
  portalUserId: string,
  projectId?: string | null
): Promise<PortalSupportMessage[]> {
  const thread = await getPortalSupportThread(portalUserId, projectId);
  return thread.messages;
}

export async function createPortalSupportMessage(
  portalUserId: string,
  body: string,
  projectId?: string | null
): Promise<PortalSupportMessageResult> {
  const progress = await getOrCreatePortalSupportProgress(portalUserId, projectId);

  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.progressMessage.create({
      data: {
        progressId: progress.id,
        kind: 'REQUEST',
        body,
      },
      select: {
        id: true,
        kind: true,
        body: true,
        createdAt: true,
      },
    });

    await tx.progress.update({
      where: { id: progress.id },
      data: { status: 'AWAITING_PROVIDER' },
    });

    return created;
  });

  return {
    progressId: progress.id,
    message: mapMessage(message),
  };
}

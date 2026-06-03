import 'server-only';

import { prisma } from '@/lib/prisma';
import { isPortalAdminRole } from '@/lib/portal-role-data';
import type { PortalSupportMessage } from '@/lib/portal-support-data';

export type PortalSupportThread = {
  progressId: string | null;
  messages: PortalSupportMessage[];
};

export type PortalSupportMessageResult = {
  progressId: string;
  message: PortalSupportMessage;
};

export type PortalSupportProjectAccess =
  | { ok: true; projectId: string; clientPortalUserId: string }
  | { ok: false; status: number; error: string };

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

/** Resolves project access for client or admin portal messaging. */
export async function resolvePortalSupportProjectForSession(
  session: { userId: string; role: string },
  projectId: string | undefined
): Promise<PortalSupportProjectAccess> {
  const trimmed = projectId?.trim();
  if (!trimmed) {
    return { ok: false, status: 400, error: 'Project is required' };
  }

  const project = await prisma.project.findUnique({
    where: { id: trimmed },
    select: {
      id: true,
      portalUserId: true,
      portalUser: { select: { role: true } },
    },
  });

  if (!project) {
    return { ok: false, status: 404, error: 'Project not found' };
  }

  if (isPortalAdminRole(project.portalUser.role)) {
    return { ok: false, status: 403, error: 'Messages are not available for this account' };
  }

  if (isPortalAdminRole(session.role)) {
    return { ok: true, projectId: project.id, clientPortalUserId: project.portalUserId };
  }

  if (project.portalUserId !== session.userId) {
    return { ok: false, status: 404, error: 'Project not found' };
  }

  return { ok: true, projectId: project.id, clientPortalUserId: project.portalUserId };
}

async function getOrCreatePortalSupportProgress(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { portalUserId: true },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  const existing = await prisma.progress.findFirst({
    where: {
      projectId,
      project: { portalUserId: project.portalUserId },
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
  _portalUserId: string,
  projectId?: string | null
): Promise<PortalSupportThread> {
  if (!projectId) {
    return { progressId: null, messages: [] };
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { portalUserId: true },
  });

  if (!project) {
    return { progressId: null, messages: [] };
  }

  const progress = await prisma.progress.findFirst({
    where: {
      projectId,
      project: { portalUserId: project.portalUserId },
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

async function createPortalSupportMessageWithKind(
  projectId: string,
  body: string,
  kind: 'REQUEST' | 'ANSWER'
): Promise<PortalSupportMessageResult> {
  const progress = await getOrCreatePortalSupportProgress(projectId);

  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.progressMessage.create({
      data: {
        progressId: progress.id,
        kind,
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
      data: {
        status: kind === 'REQUEST' ? 'AWAITING_PROVIDER' : 'AWAITING_CLIENT',
      },
    });

    return created;
  });

  return {
    progressId: progress.id,
    message: mapMessage(message),
  };
}

/** Client → all9s message on a project thread. */
export async function createPortalClientSupportMessage(
  projectId: string,
  body: string
): Promise<PortalSupportMessageResult> {
  return createPortalSupportMessageWithKind(projectId, body, 'REQUEST');
}

/** all9s → client message on a project thread. */
export async function createPortalProviderSupportMessage(
  projectId: string,
  body: string
): Promise<PortalSupportMessageResult> {
  return createPortalSupportMessageWithKind(projectId, body, 'ANSWER');
}

/** @deprecated Use createPortalClientSupportMessage */
export async function createPortalSupportMessage(
  _portalUserId: string,
  body: string,
  projectId?: string | null
): Promise<PortalSupportMessageResult> {
  if (!projectId) {
    throw new Error('Project is required');
  }

  return createPortalClientSupportMessage(projectId, body);
}

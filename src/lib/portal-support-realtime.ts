import type { PortalSupportMessage, PortalSupportMessageKind } from '@/lib/portal-support-data';

export function mapProgressMessageRow(row: Record<string, unknown>): PortalSupportMessage | null {
  const id = row.id;
  const kind = row.kind;
  const body = row.body;
  const createdAt = row.createdAt;

  if (typeof id !== 'string' || typeof body !== 'string' || !createdAt) {
    return null;
  }

  if (kind !== 'REQUEST' && kind !== 'ANSWER') {
    return null;
  }

  const createdIso =
    createdAt instanceof Date
      ? createdAt.toISOString()
      : new Date(String(createdAt)).toISOString();

  if (Number.isNaN(new Date(createdIso).getTime())) {
    return null;
  }

  return {
    id,
    kind: kind as PortalSupportMessageKind,
    body,
    createdAt: createdIso,
  };
}

export function mergePortalSupportMessages(
  current: PortalSupportMessage[],
  incoming: PortalSupportMessage
): PortalSupportMessage[] {
  if (current.some((message) => message.id === incoming.id)) {
    return current;
  }

  return [...current, incoming].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function getPortalSupportRealtimeChannelName(progressId: string): string {
  return `portal-messages:${progressId}`;
}

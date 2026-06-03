import { prisma } from '@/lib/prisma';
import {
  type PortalAdminConsultationClientDetail,
  type PortalAdminConsultationClientRow,
  type PortalAdminConsultationDetail,
  type PortalAdminConsultationRow,
} from '@/lib/portal-admin-client-display';
import { buildConsultationClientKey, parseConsultationClientKey } from '@/lib/portal-consultation-client-key';
import { listConsultationRequestsForEmail, listConsultationRequestsForPortalUser } from '@/lib/portal-consultation-requests';
import { isPortalAdminRole, PORTAL_ROLE_ADMIN } from '@/lib/portal-role-data';
import type { PortalAdminClientCategoryCounts } from '@/lib/portal-admin-nav';
import { normalizePortalEmail } from '@/lib/portal-user';
import { CONSULTATION_EMAIL_DELIVERY_STATUS } from '@/lib/consultation-email-delivery';

export type {
  PortalAdminConsultationClientDetail,
  PortalAdminConsultationClientRow,
  PortalAdminConsultationDetail,
  PortalAdminConsultationRow,
} from '@/lib/portal-admin-client-display';
export {
  formatPortalAdminConsultationDate,
  formatPortalAdminConsultationTableDate,
  formatPortalAdminPreferredContact,
  getPortalAdminCompletedClientDetailPath,
  getPortalAdminConsultationDetailPath,
  getPortalAdminCurrentClientDetailPath,
} from '@/lib/portal-admin-client-display';

/** Matches active project statuses used elsewhere in the portal (timeline, amount due). */
export const PORTAL_ADMIN_ACTIVE_PROJECT_STATUSES = ['PLANNED', 'ACTIVE', 'ON_HOLD'] as const;

export const PORTAL_ADMIN_COMPLETED_PROJECT_STATUSES = ['COMPLETED'] as const;

/** Consultation request with no linked project (for Consultations menu). */
export function isPortalAdminConsultationRequest(options: {
  email: string;
  portalUserId: string | null;
  linkedPortalUserRole: string | null;
  hasLinkedProject: boolean;
  portalUserIdsWithAdminRole: ReadonlySet<string>;
  emailsWithAdminPortalUsers: ReadonlySet<string>;
}): boolean {
  if (options.hasLinkedProject) {
    return false;
  }

  if (isPortalAdminRole(options.linkedPortalUserRole)) {
    return false;
  }

  if (options.portalUserId && options.portalUserIdsWithAdminRole.has(options.portalUserId)) {
    return false;
  }

  if (options.emailsWithAdminPortalUsers.has(normalizePortalEmail(options.email))) {
    return false;
  }

  return true;
}

/** @deprecated Use isPortalAdminConsultationRequest — kept for tests naming consistency. */
export function isPortalAdminConsultationClient(options: {
  email: string;
  portalUserId: string | null;
  linkedPortalUserRole: string | null;
  hasActiveLinkedProject: boolean;
  portalUserIdsWithActiveProjects: ReadonlySet<string>;
  emailsWithActiveProjects: ReadonlySet<string>;
  portalUserIdsWithAdminRole: ReadonlySet<string>;
  emailsWithAdminPortalUsers: ReadonlySet<string>;
}): boolean {
  if (options.hasActiveLinkedProject) {
    return false;
  }

  return isPortalAdminConsultationRequest({
    email: options.email,
    portalUserId: options.portalUserId,
    linkedPortalUserRole: options.linkedPortalUserRole,
    hasLinkedProject: options.hasActiveLinkedProject,
    portalUserIdsWithAdminRole: options.portalUserIdsWithAdminRole,
    emailsWithAdminPortalUsers: options.emailsWithAdminPortalUsers,
  });
}

type PortalAdminClientFilterOptions = {
  email: string;
  portalUserId: string | null;
  linkedPortalUserRole: string | null;
  hasActiveLinkedProject: boolean;
  portalUserIdsWithActiveProjects: ReadonlySet<string>;
  emailsWithActiveProjects: ReadonlySet<string>;
  portalUserIdsWithAdminRole: ReadonlySet<string>;
  emailsWithAdminPortalUsers: ReadonlySet<string>;
};

function isExcludedAdminPortalClient(options: Pick<
  PortalAdminClientFilterOptions,
  'email' | 'portalUserId' | 'linkedPortalUserRole' | 'portalUserIdsWithAdminRole' | 'emailsWithAdminPortalUsers'
>): boolean {
  if (isPortalAdminRole(options.linkedPortalUserRole)) {
    return true;
  }

  if (options.portalUserId && options.portalUserIdsWithAdminRole.has(options.portalUserId)) {
    return true;
  }

  return options.emailsWithAdminPortalUsers.has(normalizePortalEmail(options.email));
}

export function isPortalAdminCurrentClient(options: PortalAdminClientFilterOptions): boolean {
  if (!options.hasActiveLinkedProject) {
    return false;
  }

  return !isExcludedAdminPortalClient(options);
}

type PortalAdminCompletedClientFilterOptions = {
  email: string;
  portalUserId: string | null;
  linkedPortalUserRole: string | null;
  hasCompletedLinkedProject: boolean;
  portalUserIdsWithCompletedProjects: ReadonlySet<string>;
  emailsWithCompletedProjects: ReadonlySet<string>;
  portalUserIdsWithAdminRole: ReadonlySet<string>;
  emailsWithAdminPortalUsers: ReadonlySet<string>;
};

export function isPortalAdminCompletedClient(options: PortalAdminCompletedClientFilterOptions): boolean {
  if (!options.hasCompletedLinkedProject) {
    return false;
  }

  return !isExcludedAdminPortalClient(options);
}

type PortalAdminCompletedFilterContext = {
  portalUserIdsWithCompletedProjects: Set<string>;
  emailsWithCompletedProjects: Set<string>;
  portalUserIdsWithAdminRole: Set<string>;
  emailsWithAdminPortalUsers: Set<string>;
};

async function loadPortalAdminCompletedFilterContext(): Promise<PortalAdminCompletedFilterContext> {
  const completedStatuses = [...PORTAL_ADMIN_COMPLETED_PROJECT_STATUSES];

  const [portalUsersWithCompletedProjects, adminPortalUsers] = await Promise.all([
    prisma.project.findMany({
      where: { status: { in: completedStatuses } },
      select: { portalUserId: true },
      distinct: ['portalUserId'],
    }),
    prisma.portalUser.findMany({
      where: { role: PORTAL_ROLE_ADMIN },
      select: { id: true },
    }),
  ]);

  const portalUserIdsWithCompletedProjects = new Set(
    portalUsersWithCompletedProjects.map((project) => project.portalUserId)
  );
  const portalUserIdsWithAdminRole = new Set(adminPortalUsers.map((user) => user.id));

  const [linkedConsultations, adminConsultations] = await Promise.all([
    prisma.consultationRequest.findMany({
      where: { portalUserId: { in: [...portalUserIdsWithCompletedProjects] } },
      select: { email: true },
    }),
    prisma.consultationRequest.findMany({
      where: { portalUserId: { in: [...portalUserIdsWithAdminRole] } },
      select: { email: true },
    }),
  ]);

  return {
    portalUserIdsWithCompletedProjects,
    emailsWithCompletedProjects: new Set(
      linkedConsultations.map((consultation) => normalizePortalEmail(consultation.email))
    ),
    portalUserIdsWithAdminRole,
    emailsWithAdminPortalUsers: new Set(
      adminConsultations.map((consultation) => normalizePortalEmail(consultation.email))
    ),
  };
}

type PortalAdminConsultationFilterContext = {
  portalUserIdsWithActiveProjects: Set<string>;
  emailsWithActiveProjects: Set<string>;
  portalUserIdsWithAdminRole: Set<string>;
  emailsWithAdminPortalUsers: Set<string>;
};

async function loadPortalAdminConsultationFilterContext(): Promise<PortalAdminConsultationFilterContext> {
  const activeStatuses = [...PORTAL_ADMIN_ACTIVE_PROJECT_STATUSES];

  const [portalUsersWithActiveProjects, adminPortalUsers] = await Promise.all([
    prisma.project.findMany({
      where: { status: { in: activeStatuses } },
      select: { portalUserId: true },
      distinct: ['portalUserId'],
    }),
    prisma.portalUser.findMany({
      where: { role: PORTAL_ROLE_ADMIN },
      select: { id: true },
    }),
  ]);

  const portalUserIdsWithActiveProjects = new Set(
    portalUsersWithActiveProjects.map((project) => project.portalUserId)
  );
  const portalUserIdsWithAdminRole = new Set(adminPortalUsers.map((user) => user.id));

  const [linkedConsultations, adminConsultations] = await Promise.all([
    prisma.consultationRequest.findMany({
      where: { portalUserId: { in: [...portalUserIdsWithActiveProjects] } },
      select: { email: true },
    }),
    prisma.consultationRequest.findMany({
      where: { portalUserId: { in: [...portalUserIdsWithAdminRole] } },
      select: { email: true },
    }),
  ]);

  return {
    portalUserIdsWithActiveProjects,
    emailsWithActiveProjects: new Set(
      linkedConsultations.map((consultation) => normalizePortalEmail(consultation.email))
    ),
    portalUserIdsWithAdminRole,
    emailsWithAdminPortalUsers: new Set(
      adminConsultations.map((consultation) => normalizePortalEmail(consultation.email))
    ),
  };
}

type ConsultationClientCandidate = {
  email: string;
  portalUserId: string | null;
  portalUser: { role: string } | null;
  projects: Array<{ id: string; title?: string }>;
};

function mapConsultationRow(row: {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  preferredContact: string;
  timezone: string | null;
  createdAt: Date;
}): PortalAdminConsultationRow {
  return {
    id: row.id,
    name: row.name.trim(),
    email: row.email.trim(),
    phone: row.phone?.trim() || null,
    company: row.company?.trim() || null,
    preferredContact: row.preferredContact === 'p' ? 'p' : 'e',
    timezone: row.timezone?.trim() || null,
    createdAt: row.createdAt.toISOString(),
  };
}

function mapCurrentClientRow(row: {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  preferredContact: string;
  timezone: string | null;
  createdAt: Date;
  projects: Array<{ title: string }>;
}): PortalAdminConsultationRow {
  return {
    ...mapConsultationRow(row),
    projectTitle: row.projects[0]?.title.trim() || null,
  };
}

function qualifiesAsConsultationRequest(
  row: ConsultationClientCandidate,
  context: PortalAdminConsultationFilterContext
): boolean {
  return isPortalAdminConsultationRequest({
    email: row.email,
    portalUserId: row.portalUserId,
    linkedPortalUserRole: row.portalUser?.role ?? null,
    hasLinkedProject: row.projects.length > 0,
    portalUserIdsWithAdminRole: context.portalUserIdsWithAdminRole,
    emailsWithAdminPortalUsers: context.emailsWithAdminPortalUsers,
  });
}

function qualifiesAsCurrentClient(
  row: ConsultationClientCandidate,
  context: PortalAdminConsultationFilterContext
): boolean {
  return isPortalAdminCurrentClient({
    email: row.email,
    portalUserId: row.portalUserId,
    linkedPortalUserRole: row.portalUser?.role ?? null,
    hasActiveLinkedProject: row.projects.length > 0,
    portalUserIdsWithActiveProjects: context.portalUserIdsWithActiveProjects,
    emailsWithActiveProjects: context.emailsWithActiveProjects,
    portalUserIdsWithAdminRole: context.portalUserIdsWithAdminRole,
    emailsWithAdminPortalUsers: context.emailsWithAdminPortalUsers,
  });
}

function qualifiesAsCompletedClient(
  row: ConsultationClientCandidate,
  context: PortalAdminCompletedFilterContext
): boolean {
  return isPortalAdminCompletedClient({
    email: row.email,
    portalUserId: row.portalUserId,
    linkedPortalUserRole: row.portalUser?.role ?? null,
    hasCompletedLinkedProject: row.projects.length > 0,
    portalUserIdsWithCompletedProjects: context.portalUserIdsWithCompletedProjects,
    emailsWithCompletedProjects: context.emailsWithCompletedProjects,
    portalUserIdsWithAdminRole: context.portalUserIdsWithAdminRole,
    emailsWithAdminPortalUsers: context.emailsWithAdminPortalUsers,
  });
}

const consultationRequestRowSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  company: true,
  preferredContact: true,
  timezone: true,
  createdAt: true,
  emailDeliveryStatus: true,
  portalUserId: true,
  portalUser: {
    select: { role: true },
  },
  projects: {
    select: { id: true },
    take: 1,
  },
} as const;

async function loadConsultationRequestRows() {
  const context = await loadPortalAdminConsultationFilterContext();

  const rows = await prisma.consultationRequest.findMany({
    where: {
      projects: { none: {} },
    },
    orderBy: { createdAt: 'desc' },
    select: consultationRequestRowSelect,
  });

  return { rows, context };
}

async function loadConsultationClientCandidates() {
  const activeStatuses = [...PORTAL_ADMIN_ACTIVE_PROJECT_STATUSES];
  const context = await loadPortalAdminConsultationFilterContext();

  const rows = await prisma.consultationRequest.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      ...consultationRequestRowSelect,
      projects: {
        where: { status: { in: activeStatuses } },
        select: { id: true, title: true },
        take: 1,
      },
    },
  });

  return { rows, context };
}

async function loadCompletedConsultationClientCandidates() {
  const completedStatuses = [...PORTAL_ADMIN_COMPLETED_PROJECT_STATUSES];
  const context = await loadPortalAdminCompletedFilterContext();

  const rows = await prisma.consultationRequest.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      company: true,
      preferredContact: true,
      timezone: true,
      createdAt: true,
      portalUserId: true,
      portalUser: {
        select: { role: true },
      },
      projects: {
        where: { status: { in: completedStatuses } },
        select: { id: true },
        take: 1,
      },
    },
  });

  return { rows, context };
}

export async function getPortalAdminConsultations(): Promise<PortalAdminConsultationClientRow[]> {
  const { rows, context } = await loadConsultationRequestRows();

  const qualifying = rows.filter((row) => qualifiesAsConsultationRequest(row, context));

  const clients = new Map<string, PortalAdminConsultationClientRow>();

  for (const row of qualifying) {
    const clientKey = buildConsultationClientKey({
      portalUserId: row.portalUserId,
      email: row.email,
    });
    const mapped = mapConsultationRow(row);
    const createdAt = mapped.createdAt;

    const existing = clients.get(clientKey);
    const requestBounced = row.emailDeliveryStatus === CONSULTATION_EMAIL_DELIVERY_STATUS.BOUNCED;
    if (!existing) {
      clients.set(clientKey, {
        clientKey,
        name: mapped.name,
        email: mapped.email,
        preferredContact: mapped.preferredContact,
        createdAt,
        requestCount: 1,
        hasBouncedEmail: requestBounced,
      });
      continue;
    }

    existing.requestCount += 1;
    existing.hasBouncedEmail = existing.hasBouncedEmail || requestBounced;
    if (new Date(createdAt).getTime() > new Date(existing.createdAt).getTime()) {
      existing.name = mapped.name;
      existing.email = mapped.email;
      existing.preferredContact = mapped.preferredContact;
      existing.createdAt = createdAt;
    }
  }

  return [...clients.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getPortalAdminCurrentClients(): Promise<PortalAdminConsultationRow[]> {
  const { rows, context } = await loadConsultationClientCandidates();

  return rows.filter((row) => qualifiesAsCurrentClient(row, context)).map(mapCurrentClientRow);
}

export async function getPortalAdminCompletedClients(): Promise<PortalAdminConsultationRow[]> {
  const { rows, context } = await loadCompletedConsultationClientCandidates();

  return rows.filter((row) => qualifiesAsCompletedClient(row, context)).map(mapConsultationRow);
}

export async function getPortalAdminClientCategoryCounts(): Promise<PortalAdminClientCategoryCounts> {
  const [
    { rows, context },
    { rows: consultationRows, context: consultationContext },
    { rows: completedRows, context: completedContext },
  ] = await Promise.all([
    loadConsultationClientCandidates(),
    loadConsultationRequestRows(),
    loadCompletedConsultationClientCandidates(),
  ]);

  let consultations = 0;
  let current = 0;

  for (const row of consultationRows) {
    if (qualifiesAsConsultationRequest(row, consultationContext)) {
      consultations += 1;
    }
  }

  for (const row of rows) {
    if (qualifiesAsCurrentClient(row, context)) {
      current += 1;
    }
  }

  let completed = 0;

  for (const row of completedRows) {
    if (qualifiesAsCompletedClient(row, completedContext)) {
      completed += 1;
    }
  }

  return { consultations, current, completed };
}

async function getPortalAdminClientDetailById(
  id: string,
  qualifies: (row: ConsultationClientCandidate, context: PortalAdminConsultationFilterContext) => boolean
): Promise<PortalAdminConsultationDetail | null> {
  const context = await loadPortalAdminConsultationFilterContext();

  const row = await prisma.consultationRequest.findUnique({
    where: { id },
    select: {
      ...consultationRequestRowSelect,
      message: true,
      updatedAt: true,
    },
  });

  if (!row || !qualifies(row, context)) {
    return null;
  }

  const base = mapConsultationRow(row);

  return {
    ...base,
    message: row.message.trim(),
    updatedAt: row.updatedAt.toISOString(),
    hasPortalAccount: row.portalUserId != null && !isPortalAdminRole(row.portalUser?.role),
    portalUserId:
      row.portalUserId != null && !isPortalAdminRole(row.portalUser?.role) ? row.portalUserId : null,
  };
}

export async function getPortalAdminConsultationById(
  id: string
): Promise<PortalAdminConsultationDetail | null> {
  return getPortalAdminClientDetailById(id, qualifiesAsConsultationRequest);
}

export async function getPortalAdminCurrentClientById(
  id: string
): Promise<PortalAdminConsultationDetail | null> {
  return getPortalAdminClientDetailById(id, qualifiesAsCurrentClient);
}

async function getPortalAdminCompletedClientDetailById(
  id: string
): Promise<PortalAdminConsultationDetail | null> {
  const completedStatuses = [...PORTAL_ADMIN_COMPLETED_PROJECT_STATUSES];
  const context = await loadPortalAdminCompletedFilterContext();

  const row = await prisma.consultationRequest.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      company: true,
      preferredContact: true,
      timezone: true,
      message: true,
      createdAt: true,
      updatedAt: true,
      portalUserId: true,
      portalUser: {
        select: { role: true },
      },
      projects: {
        where: { status: { in: completedStatuses } },
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!row || !qualifiesAsCompletedClient(row, context)) {
    return null;
  }

  const base = mapConsultationRow(row);

  return {
    ...base,
    message: row.message.trim(),
    updatedAt: row.updatedAt.toISOString(),
    hasPortalAccount: row.portalUserId != null && !isPortalAdminRole(row.portalUser?.role),
    portalUserId:
      row.portalUserId != null && !isPortalAdminRole(row.portalUser?.role) ? row.portalUserId : null,
  };
}

export async function getPortalAdminCompletedClientById(
  id: string
): Promise<PortalAdminConsultationDetail | null> {
  return getPortalAdminCompletedClientDetailById(id);
}

export async function getPortalAdminConsultationClientByKey(
  clientKey: string
): Promise<PortalAdminConsultationClientDetail | null> {
  const parsed = parseConsultationClientKey(clientKey);
  const { rows, context } = await loadConsultationRequestRows();

  const qualifying = rows.filter((row) => {
    if (!qualifiesAsConsultationRequest(row, context)) {
      return false;
    }

    const key = buildConsultationClientKey({ portalUserId: row.portalUserId, email: row.email });
    return key === clientKey;
  });

  if (qualifying.length === 0) {
    return null;
  }

  const linkedPortalUserId =
    'portalUserId' in parsed
      ? parsed.portalUserId
      : qualifying.find((row) => row.portalUserId)?.portalUserId ?? null;

  const requests = (
    linkedPortalUserId
      ? await listConsultationRequestsForPortalUser(linkedPortalUserId)
      : await listConsultationRequestsForEmail(
          'email' in parsed ? parsed.email : qualifying[0]!.email
        )
  ).filter((request) => !request.projectId);

  if (requests.length === 0) {
    return null;
  }

  const latest = requests[0]!;
  const portalUserId = linkedPortalUserId;

  const portalUser = portalUserId
    ? await prisma.portalUser.findUnique({
        where: { id: portalUserId },
        select: { role: true },
      })
    : null;

  const hasPortalAccount = portalUserId != null && !isPortalAdminRole(portalUser?.role);

  return {
    clientKey,
    name: latest.name,
    email: latest.email,
    phone: latest.phone,
    company: latest.company,
    preferredContact: latest.preferredContact,
    timezone: latest.timezone,
    message: latest.message,
    createdAt: latest.createdAt,
    updatedAt: latest.updatedAt,
    hasPortalAccount,
    portalUserId: hasPortalAccount ? portalUserId : null,
    primaryConsultationRequestId: latest.id,
    requests,
  };
}

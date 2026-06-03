import type { PortalConsultationRequestDetail } from '@/lib/portal-consultation-requests-data';

export type { PortalConsultationRequestDetail };

export type PortalAdminConsultationRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  projectTitle?: string | null;
  preferredContact: 'e' | 'p';
  timezone: string | null;
  createdAt: string;
};

/** One row per client in the Consultations table. */
export type PortalAdminConsultationClientRow = {
  clientKey: string;
  name: string;
  email: string;
  preferredContact: 'e' | 'p';
  createdAt: string;
  requestCount: number;
  hasBouncedEmail: boolean;
};

export type PortalAdminConsultationDetail = PortalAdminConsultationRow & {
  message: string;
  updatedAt: string;
  hasPortalAccount: boolean;
  portalUserId: string | null;
};

/** Client selected from the Consultations table (may have many requests). */
export type PortalAdminConsultationClientDetail = {
  clientKey: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  preferredContact: 'e' | 'p';
  timezone: string | null;
  message: string;
  createdAt: string;
  updatedAt: string;
  hasPortalAccount: boolean;
  portalUserId: string | null;
  /** Latest request id — used for admin contact-field APIs. */
  primaryConsultationRequestId: string;
  requests: PortalConsultationRequestDetail[];
};

export type PortalClientHeroInfo = {
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  preferredContact: 'e' | 'p';
  timezone: string | null;
  message: string;
  submittedAt: string;
  hasPortalAccount: boolean;
  agreementSigned: boolean;
  mustChangePassword: boolean;
};

export function getPortalAdminConsultationDetailPath(id: string): string {
  return `/portal/admin/clients/consultations/${encodeURIComponent(id)}`;
}

export function getPortalAdminCurrentClientDetailPath(id: string): string {
  return `/portal/admin/clients/current/${id}`;
}

export function getPortalAdminCompletedClientDetailPath(id: string): string {
  return `/portal/admin/clients/completed/${id}`;
}

export function formatPortalAdminConsultationDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}

export function formatPortalAdminConsultationTableDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: '2-digit',
  }).format(new Date(iso));
}

export function formatPortalAdminPreferredContact(value: 'e' | 'p'): string {
  return value === 'p' ? 'Phone' : 'Email';
}

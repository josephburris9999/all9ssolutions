'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  formatPortalAdminConsultationDate,
  formatPortalAdminConsultationTableDate,
  formatPortalAdminPreferredContact,
} from '@/lib/portal-admin-client-display';
import type {
  PortalConsultationRequestDetail,
  PortalConsultationRequestLinkedProject,
} from '@/lib/portal-consultation-requests-data';
import { portalProjectDashboardHref } from '@/lib/portal-role-data';
import { formatPhoneNumber } from '@/lib/phone';
import { cn } from '@/lib/utils';
import { PortalConsultationRequestAgreementRow } from '@/components/portal-consultation-request-agreement-row';
import { ConsultationEmailDeliveryBadge } from '@/components/consultation-email-delivery-badge';
import type { PortalClientProfile } from '@/lib/portal-user';

type PortalConsultationRequestsAccordionProps = {
  requests: PortalConsultationRequestDetail[];
  defaultOpenRequestId?: string | null;
  /** When set, linked requests show an action to open that project on this base path. */
  projectDashboardBasePath?: string;
  /** Fallback when request rows omit projectId (e.g. from selectable project list). */
  linkedProjects?: PortalConsultationRequestLinkedProject[];
  /** When set (client portal), shows per-consultation agreement sign / download controls. */
  clientProfile?: PortalClientProfile;
  clientTimezone?: string | null;
  /** When true, all panels start collapsed (client Your projects section). */
  startCollapsed?: boolean;
};

function resolveRequestProject(
  request: PortalConsultationRequestDetail,
  linkedProjects?: PortalConsultationRequestLinkedProject[]
): { projectId: string; projectTitle: string | null } | null {
  if (request.projectId) {
    return { projectId: request.projectId, projectTitle: request.projectTitle };
  }

  const linked = linkedProjects?.find((project) => project.consultationRequestId === request.id);
  if (!linked) {
    return null;
  }

  return {
    projectId: linked.id,
    projectTitle: linked.title.trim() || null,
  };
}

function formatPhoneDisplay(phone: string | null): string {
  if (!phone) {
    return '—';
  }

  const formatted = formatPhoneNumber(phone);
  return formatted.length > 0 ? formatted : phone;
}

function requestAccordionValue(requestId: string): string {
  return `request-${requestId}`;
}

function RequestFields({
  request,
  linkEmail = true,
  compact = false,
}: {
  request: PortalConsultationRequestDetail;
  linkEmail?: boolean;
  compact?: boolean;
}) {
  const valueClass = compact ? 'min-w-0 truncate text-foreground' : 'text-foreground';
  const fieldClass = compact
    ? 'min-w-0 w-full space-y-1 sm:min-w-[10rem] sm:w-auto sm:flex-[1_1_11rem]'
    : 'min-w-[10rem] flex-[1_1_11rem] space-y-1';

  return (
    <dl
      className={
        compact
          ? 'flex min-w-0 flex-col gap-y-4 text-sm sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-4'
          : 'flex flex-wrap gap-x-6 gap-y-4 text-sm'
      }
    >
      <div className={fieldClass}>
        <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</dt>
        <dd className={valueClass} title={compact ? request.name.trim() || undefined : undefined}>
          {request.name.trim() || '—'}
        </dd>
      </div>
      <div className={fieldClass}>
        <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Company</dt>
        <dd className={valueClass} title={compact ? request.company ?? undefined : undefined}>
          {request.company ?? '—'}
        </dd>
      </div>
      <div className={fieldClass}>
        <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</dt>
        <dd className={compact ? 'min-w-0 text-foreground' : 'text-foreground'}>
          <span
            className={
              compact
                ? 'flex min-w-0 flex-col items-start gap-1 sm:inline-flex sm:flex-row sm:flex-wrap sm:items-center sm:gap-2'
                : 'inline-flex flex-wrap items-center gap-2'
            }
          >
            {linkEmail ? (
              <a
                href={`mailto:${encodeURIComponent(request.email)}`}
                className={cn(
                  'transition-colors hover:text-primary',
                  compact && 'min-w-0 max-w-full truncate'
                )}
                title={compact ? request.email : undefined}
              >
                {request.email}
              </a>
            ) : (
              <span className="min-w-0 max-w-full truncate" title={request.email}>
                {request.email}
              </span>
            )}
            <ConsultationEmailDeliveryBadge status={request.emailDeliveryStatus} />
          </span>
        </dd>
      </div>
      <div className={fieldClass}>
        <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Phone</dt>
        <dd className={valueClass} title={compact ? formatPhoneDisplay(request.phone) : undefined}>
          {formatPhoneDisplay(request.phone)}
        </dd>
      </div>
      <div className={fieldClass}>
        <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {compact ? 'Contact' : 'Preferred'}
        </dt>
        <dd className={valueClass}>{formatPortalAdminPreferredContact(request.preferredContact)}</dd>
      </div>
      <div className={fieldClass}>
        <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Timezone</dt>
        <dd className={valueClass} title={compact ? request.timezone ?? undefined : undefined}>
          {request.timezone ?? '—'}
        </dd>
      </div>
      <div className="min-w-0 w-full basis-full space-y-1">
        <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Request</dt>
        <dd
          className={
            compact
              ? 'line-clamp-4 min-w-0 break-words text-foreground'
              : 'whitespace-pre-wrap leading-relaxed text-foreground'
          }
          title={compact ? request.message : undefined}
        >
          {request.message}
        </dd>
      </div>
    </dl>
  );
}

export function PortalConsultationRequestsAccordion({
  requests,
  defaultOpenRequestId,
  projectDashboardBasePath,
  linkedProjects,
  clientProfile,
  clientTimezone,
  startCollapsed = false,
}: PortalConsultationRequestsAccordionProps) {
  const initialOpen = useMemo(() => {
    if (startCollapsed || requests.length === 0) {
      return [];
    }

    const preferredId = defaultOpenRequestId ?? requests[0]?.id;
    const match = requests.find((request) => request.id === preferredId);
    const openId = match?.id ?? requests[0]!.id;

    return [requestAccordionValue(openId)];
  }, [defaultOpenRequestId, requests, startCollapsed]);

  const [openValues, setOpenValues] = useState<string[]>(initialOpen);

  useEffect(() => {
    setOpenValues(initialOpen);
  }, [initialOpen]);

  if (requests.length === 0) {
    return <p className="text-sm text-muted-foreground">No consultation requests to display.</p>;
  }

  return (
    <Accordion type="multiple" value={openValues} onValueChange={setOpenValues} className="max-w-3xl">
      {requests.map((request) => {
        const value = requestAccordionValue(request.id);
        const summaryParts = [request.name.trim(), request.company?.trim()].filter(Boolean);
        const summary = summaryParts.join(' · ') || 'Consultation request';
        const submittedLabel = clientProfile
          ? formatPortalAdminConsultationTableDate(request.createdAt)
          : formatPortalAdminConsultationDate(request.createdAt);
        const linkedProject = resolveRequestProject(request, linkedProjects);
        const subtitleParts = [`Submitted ${submittedLabel}`];
        if (linkedProject?.projectTitle) {
          subtitleParts.push(linkedProject.projectTitle);
        }
        const subtitle = subtitleParts.join(' · ');
        const projectHref =
          projectDashboardBasePath && linkedProject
            ? portalProjectDashboardHref(projectDashboardBasePath, linkedProject.projectId)
            : null;

        return (
          <AccordionItem key={request.id} value={value}>
            <AccordionTrigger
              value={value}
              actions={
                projectHref ? (
                  <Button asChild variant="outline" size="sm" className="shrink-0">
                    <Link href={projectHref}>Open Project</Link>
                  </Button>
                ) : undefined
              }
            >
              <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left">
                <span className="w-full truncate font-medium" title={summary}>
                  {summary}
                </span>
                <span
                  className="w-full truncate text-xs font-normal text-muted-foreground"
                  title={subtitle}
                >
                  {subtitle}
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent value={value}>
              <RequestFields request={request} linkEmail={!clientProfile} compact={Boolean(clientProfile)} />
              {clientProfile ? (
                <PortalConsultationRequestAgreementRow
                  agreement={request.clientServiceAgreement}
                  clientProfile={clientProfile}
                  clientTimezone={clientTimezone ?? null}
                />
              ) : null}
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}

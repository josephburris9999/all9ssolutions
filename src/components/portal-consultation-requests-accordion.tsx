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
  formatPortalAdminPreferredContact,
} from '@/lib/portal-admin-client-display';
import type {
  PortalConsultationRequestDetail,
  PortalConsultationRequestLinkedProject,
} from '@/lib/portal-consultation-requests-data';
import { portalProjectDashboardHref } from '@/lib/portal-role-data';
import { formatPhoneNumber } from '@/lib/phone';
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
}: {
  request: PortalConsultationRequestDetail;
  linkEmail?: boolean;
}) {
  return (
    <dl className="flex flex-wrap gap-x-6 gap-y-4 text-sm">
      <div className="min-w-[10rem] flex-[1_1_11rem] space-y-1">
        <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</dt>
        <dd className="text-foreground">{request.name.trim() || '—'}</dd>
      </div>
      <div className="min-w-[10rem] flex-[1_1_11rem] space-y-1">
        <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Company</dt>
        <dd className="text-foreground">{request.company ?? '—'}</dd>
      </div>
      <div className="min-w-[10rem] flex-[1_1_11rem] space-y-1">
        <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</dt>
        <dd className="text-foreground">
          <span className="inline-flex flex-wrap items-center gap-2">
            {linkEmail ? (
              <a
                href={`mailto:${encodeURIComponent(request.email)}`}
                className="transition-colors hover:text-primary"
              >
                {request.email}
              </a>
            ) : (
              request.email
            )}
            <ConsultationEmailDeliveryBadge status={request.emailDeliveryStatus} />
          </span>
        </dd>
      </div>
      <div className="min-w-[10rem] flex-[1_1_11rem] space-y-1">
        <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Phone</dt>
        <dd className="text-foreground">{formatPhoneDisplay(request.phone)}</dd>
      </div>
      <div className="min-w-[10rem] flex-[1_1_11rem] space-y-1">
        <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Preferred</dt>
        <dd className="text-foreground">{formatPortalAdminPreferredContact(request.preferredContact)}</dd>
      </div>
      <div className="min-w-[10rem] flex-[1_1_11rem] space-y-1">
        <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Timezone</dt>
        <dd className="text-foreground">{request.timezone ?? '—'}</dd>
      </div>
      <div className="min-w-full basis-full space-y-1">
        <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Request</dt>
        <dd className="whitespace-pre-wrap leading-relaxed text-foreground">{request.message}</dd>
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
        const submittedLabel = formatPortalAdminConsultationDate(request.createdAt);
        const linkedProject = resolveRequestProject(request, linkedProjects);
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
                    <Link href={projectHref}>Open project</Link>
                  </Button>
                ) : undefined
              }
            >
              <span className="flex min-w-0 flex-col items-start gap-0.5 text-left">
                <span className="font-medium">{summary}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  Submitted {submittedLabel}
                  {linkedProject?.projectTitle ? ` · ${linkedProject.projectTitle}` : ''}
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent value={value}>
              <RequestFields request={request} linkEmail={!clientProfile} />
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

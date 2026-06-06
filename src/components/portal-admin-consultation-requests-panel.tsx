'use client';

import { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { PortalAdminConsultationCreateProjectForm } from '@/components/portal-admin-consultation-create-project-form';
import { PortalAdminConsultationDiscussionField } from '@/components/portal-admin-consultation-discussion-field';
import { PortalConsultationEditableFields } from '@/components/portal-consultation-editable-fields';
import { formatPortalAdminConsultationDate } from '@/lib/portal-admin-client-display';
import type { PortalConsultationRequestDetail } from '@/lib/portal-consultation-requests-data';

type PortalAdminConsultationRequestsPanelProps = {
  requests: PortalConsultationRequestDetail[];
  defaultOpenRequestId?: string | null;
};

function requestAccordionValue(requestId: string): string {
  return `request-${requestId}`;
}

function PortalAdminConsultationRequestAccordionContent({
  request,
}: {
  request: PortalConsultationRequestDetail;
}) {
  const [discussionSaved, setDiscussionSaved] = useState(Boolean(request.clientDiscussion));

  return (
    <>
      <PortalConsultationEditableFields
        consultationRequestId={request.id}
        hidePortalCredentials
        info={{
          name: request.name,
          email: request.email,
          company: request.company,
          phone: request.phone,
          preferredContact: request.preferredContact,
          timezone: request.timezone,
          message: request.message,
          submittedAt: request.createdAt,
          hasPortalAccount: false,
        }}
      />
      <PortalAdminConsultationDiscussionField
        consultationRequestId={request.id}
        initialDiscussion={request.clientDiscussion}
        editable={!request.projectId}
        onDiscussionSaved={() => setDiscussionSaved(true)}
      />
      {discussionSaved ? <PortalAdminConsultationCreateProjectForm request={request} /> : null}
    </>
  );
}

export function PortalAdminConsultationRequestsPanel({
  requests,
  defaultOpenRequestId,
}: PortalAdminConsultationRequestsPanelProps) {
  const openRequests = requests.filter((request) => !request.projectId);
  const preferredId = defaultOpenRequestId ?? openRequests[0]?.id;
  const initialOpen = preferredId ? [requestAccordionValue(preferredId)] : [];

  const [openValues, setOpenValues] = useState<string[]>(initialOpen);

  if (openRequests.length === 0) {
    return <p className="text-sm text-muted-foreground">No consultation requests to display.</p>;
  }

  return (
    <Accordion type="multiple" value={openValues} onValueChange={setOpenValues} className="max-w-3xl">
      {openRequests.map((request) => {
        const value = requestAccordionValue(request.id);
        const summaryParts = [request.name.trim(), request.company?.trim()].filter(Boolean);
        const summary = summaryParts.join(' · ') || 'Consultation request';
        const submittedLabel = formatPortalAdminConsultationDate(request.createdAt);

        return (
          <AccordionItem key={request.id} value={value}>
            <AccordionTrigger value={value}>
              <span className="flex min-w-0 flex-col items-start gap-0.5 text-left">
                <span className="font-medium">{summary}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  Submitted {submittedLabel}
                  {' · No project yet'}
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent value={value}>
              <PortalAdminConsultationRequestAccordionContent request={request} />
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}

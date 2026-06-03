import { PortalAgreementSection } from '@/components/portal-agreement-section';
import { PortalAmountDueSection } from '@/components/portal-amount-due-section';
import { PortalContentUploadSection } from '@/components/portal-content-upload-section';
import { PortalProjectTimeline } from '@/components/portal-project-timeline';
import { PortalSupportSection } from '@/components/portal-support-section';
import type { PortalAdminCurrentProjectWorkspace } from '@/lib/portal-admin-current-project-workspace';

type PortalAdminCurrentProjectWorkspaceProps = {
  workspace: PortalAdminCurrentProjectWorkspace;
};

export function PortalAdminCurrentProjectWorkspaceSections({
  workspace,
}: PortalAdminCurrentProjectWorkspaceProps) {
  const { dashboard, consultationRequestId, projectId, projectTitle } = workspace;
  const {
    clientName,
    clientProfile,
    clientTimezone,
    agreements,
    projectTimelines,
    amountSummary,
    supportThread,
    contentUploads,
    timelineReferenceNow,
  } = dashboard;

  return (
    <>
      <section className="relative bg-secondary/30 px-[1.25rem] py-24">
        <div className="container mx-auto px-4">
          <p className="mb-8 text-sm text-muted-foreground">
            Viewing <span className="font-medium text-foreground">{projectTitle}</span> for{' '}
            <span className="font-medium text-foreground">{clientName}</span>
          </p>
          <PortalAgreementSection
            clientName={clientName}
            clientProfile={clientProfile}
            clientTimezone={clientTimezone}
            agreements={agreements}
            readOnly
            consultationRequestId={consultationRequestId}
            initialAccordionCollapsed
            showAddAgreementButton
          />
        </div>
      </section>

      <section className="relative bg-background px-[1.25rem] py-24">
        <div className="container mx-auto px-4">
          <PortalProjectTimeline
            projects={projectTimelines}
            referenceNow={timelineReferenceNow}
            description="View progress from the client's consultation date through the project's estimated completion date."
            emptyMessage="The project timeline will appear here once a consultation is linked to this client's account."
            showUpdateEstimatedCompletionButton
          />
        </div>
      </section>

      <section className="relative bg-secondary/30 px-[1.25rem] py-24">
        <div className="container mx-auto px-4">
          <PortalAmountDueSection amounts={amountSummary} showPaymentActions={false} />
        </div>
      </section>

      <section className="relative bg-background px-[1.25rem] py-24">
        <div className="container mx-auto px-4">
          <PortalSupportSection
            initialMessages={supportThread.messages}
            initialProgressId={supportThread.progressId}
            timeZone={clientTimezone}
            projectId={projectId}
            audience="admin"
          />
        </div>
      </section>

      <section className="relative bg-secondary/30 px-[1.25rem] py-24">
        <div className="container mx-auto px-4">
          <PortalContentUploadSection
            initialUploads={contentUploads}
            timeZone={clientTimezone}
            projectId={projectId}
            readOnly
            consultationRequestId={consultationRequestId}
          />
        </div>
      </section>
    </>
  );
}

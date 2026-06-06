import { PortalAdminAmountDueSection } from '@/components/portal-admin-amount-due-section';
import { PortalAdminProjectTimelineSection } from '@/components/portal-admin-project-timeline-section';
import { PortalAgreementSection } from '@/components/portal-agreement-section';
import { PortalContentUploadSection } from '@/components/portal-content-upload-section';
import { PortalSupportSection } from '@/components/portal-support-section';
import type { PortalAdminCompletedProjectWorkspace } from '@/lib/portal-admin-completed-project-workspace';

type PortalAdminCompletedProjectWorkspaceProps = {
  workspace: PortalAdminCompletedProjectWorkspace;
};

export function PortalAdminCompletedProjectWorkspaceSections({
  workspace,
}: PortalAdminCompletedProjectWorkspaceProps) {
  const { dashboard, consultationRequestId, projectId, projectTitle, projectStatus } = workspace;
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
            Viewing completed project{' '}
            <span className="font-medium text-foreground">{projectTitle}</span> for{' '}
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
            showReactivateProjectButton
            projectId={projectId}
            projectStatus={projectStatus}
          />
        </div>
      </section>

      <section className="relative bg-background px-[1.25rem] py-24">
        <div className="container mx-auto px-4">
          <PortalAdminProjectTimelineSection
            projects={projectTimelines}
            referenceNow={timelineReferenceNow}
            projectId={projectId}
            showUpdateEstimatedCompletion={false}
            description="Final progress from the client's consultation date through project completion."
            emptyMessage="Timeline data is not available for this completed project."
          />
        </div>
      </section>

      <section className="relative bg-secondary/30 px-[1.25rem] py-24">
        <div className="container mx-auto px-4">
          <PortalAdminAmountDueSection amounts={amountSummary} projectId={projectId} />
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
            readOnly
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
            showReactivateProjectButton
            projectStatus={projectStatus}
          />
        </div>
      </section>
    </>
  );
}

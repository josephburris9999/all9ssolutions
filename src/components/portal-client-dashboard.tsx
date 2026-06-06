import { PortalAgreementSection } from '@/components/portal-agreement-section';
import { PortalAmountDueSection } from '@/components/portal-amount-due-section';
import { PortalClientHeroInfo } from '@/components/portal-client-hero-info';
import { PortalProjectTimeline } from '@/components/portal-project-timeline';
import { PortalContentUploadSection } from '@/components/portal-content-upload-section';
import { PortalSupportSection } from '@/components/portal-support-section';
import { PortalClientConsultationRequestsSection } from '@/components/portal-client-consultation-requests-section';
import type {
  PortalConsultationRequestDetail,
  PortalConsultationRequestLinkedProject,
} from '@/lib/portal-consultation-requests-data';
import type { PortalDashboardView } from '@/lib/portal-dashboard-data';
import { PORTAL_PROJECT_AGREEMENTS_UNSIGNED_MESSAGE } from '@/lib/portal-agreement-data';

/** Admin portal: project-scoped controls (Add/Complete agreement, etc.). */
export type PortalAdminProjectWorkspaceProps = {
  projectId: string;
  projectStatus: string;
};

type PortalClientDashboardProps = PortalDashboardView & {
  heroTitle?: string;
  heroIdentityPrefix?: string;
  /** When set (e.g. admin portal), shown after `heroIdentityPrefix` instead of `clientName`. */
  heroIdentityName?: string;
  consultationRequestId?: string;
  allowCreatePortalAccount?: boolean;
  consultationRequests?: PortalConsultationRequestDetail[];
  /** Client-facing portal: show consultation requests accordion after hero. */
  showClientConsultationRequests?: boolean;
  /** Client portal: show set-password button in hero when required. */
  showPasswordChangeButton?: boolean;
  /** From session — whether the signed-in client must set a new password. */
  mustChangePassword?: boolean;
  /** Client projects used to resolve open-project links on consultation requests. */
  linkedProjectsForRequests?: PortalConsultationRequestLinkedProject[];
  /** Client portal: only these project ids may be opened from consultation requests. */
  activeProjectIds?: ReadonlySet<string>;
  /** Client portal: show project-scoped workspace sections (agreements, timeline, etc.). */
  showClientProjectWorkspace?: boolean;
  /**
   * Admin portal viewing a client project (`/portal/admin/clients/.../[id]?project=`).
   * Enables Add Agreement, Complete Project, and keeps Signed in as on the admin identity.
   */
  adminProjectWorkspace?: PortalAdminProjectWorkspaceProps | null;
  /** @deprecated Prefer `adminProjectWorkspace`. */
  showAddAgreementButton?: boolean;
};

export function PortalClientDashboard({
  clientName,
  clientProfile,
  clientTimezone,
  selectedProject,
  agreements,
  agreementStatus,
  projectTimelines,
  amountSummary,
  supportThread,
  contentUploads,
  timelineReferenceNow,
  heroInfo,
  heroTitle = 'Client Projects',
  heroIdentityPrefix = 'Signed in as',
  heroIdentityName,
  consultationRequestId,
  allowCreatePortalAccount = false,
  consultationRequests,
  showClientConsultationRequests = false,
  showPasswordChangeButton = false,
  mustChangePassword = false,
  linkedProjectsForRequests,
  activeProjectIds,
  showClientProjectWorkspace = false,
  adminProjectWorkspace = null,
  showAddAgreementButton = false,
}: PortalClientDashboardProps) {
  const requests = consultationRequests ?? [];
  const hideRequestInHero = showClientConsultationRequests && requests.length > 0;
  const showWorkspace = showClientProjectWorkspace && selectedProject != null;
  const workspaceProjectId = selectedProject?.id ?? null;
  const allAgreementsSigned = agreementStatus.signed;
  const supportAudience = consultationRequestId ? 'admin' : 'client';
  const showAdminProjectControls = adminProjectWorkspace != null || showAddAgreementButton;
  const adminProjectId = adminProjectWorkspace?.projectId ?? selectedProject?.id ?? null;
  const adminProjectStatus = adminProjectWorkspace?.projectStatus;
  const isAdminPortalView = consultationRequestId != null || adminProjectWorkspace != null;
  const identityName = heroIdentityName ?? (isAdminPortalView ? 'Admin' : clientName);
  return (
    <>
      <section className="relative overflow-hidden bg-background px-[1.25rem] pb-16 pt-28 md:pb-20 md:pt-32">
        <div className="iso-neon-grid-layer" aria-hidden>
          <div className="iso-neon-grid-layer-drift" />
        </div>
        <div className="absolute top-0 left-1/2 z-[1] h-[1px] w-full -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="container relative z-10 mx-auto px-4">
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {heroTitle}
          </h1>
          <p className="mb-4 text-lg text-muted-foreground">
            {heroIdentityPrefix} <span className="text-foreground">{identityName}</span>
          </p>
          <div className="mb-8" />
          {!showPasswordChangeButton ? (
            <div className="w-full max-w-3xl">
              <PortalClientHeroInfo
                info={{
                  ...heroInfo,
                  mustChangePassword: mustChangePassword || heroInfo.mustChangePassword,
                }}
                consultationRequestId={consultationRequestId}
                allowCreatePortalAccount={allowCreatePortalAccount}
                hideRequestInHero={hideRequestInHero}
                hidePortalCredentials={showPasswordChangeButton}
                showClientPasswordReset={showPasswordChangeButton}
                allowEditNameAndCompany={!showPasswordChangeButton}
              />
            </div>
          ) : null}
        </div>
        <div className="absolute bottom-0 left-1/2 z-[1] h-[1px] w-full -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      </section>

      {showClientConsultationRequests && requests.length > 0 ? (
        <PortalClientConsultationRequestsSection
          requests={requests}
          linkedProjects={linkedProjectsForRequests}
          activeProjectIds={activeProjectIds}
          clientProfile={clientProfile}
          clientTimezone={clientTimezone}
        />
      ) : null}

      {showWorkspace ? (
        <>
          <section className="relative bg-secondary/30 px-[1.25rem] py-24">
            <div className="container mx-auto px-4">
              <p className="mb-8 text-sm text-muted-foreground">
                Viewing{' '}
                <span className="font-medium text-foreground">{selectedProject.title}</span> for{' '}
                <span className="font-medium text-foreground">{clientName}</span>
              </p>
              <PortalAgreementSection
                clientName={clientName}
                clientProfile={clientProfile}
                clientTimezone={clientTimezone}
                agreements={agreements}
                showSignedAgreementNotice
                readOnly={false}
              />
            </div>
          </section>

          <section className="relative bg-background px-[1.25rem] py-24">
            <div className="container mx-auto px-4">
              <PortalProjectTimeline
                projects={projectTimelines}
                referenceNow={timelineReferenceNow}
                emptyMessage={
                  !allAgreementsSigned ? PORTAL_PROJECT_AGREEMENTS_UNSIGNED_MESSAGE : undefined
                }
              />
            </div>
          </section>

          <section className="relative bg-secondary/30 px-[1.25rem] py-24">
            <div className="container mx-auto px-4">
              <PortalAmountDueSection
                amounts={amountSummary}
                showPaymentActions
                ledgerLayout
                allAgreementsSigned={allAgreementsSigned}
              />
            </div>
          </section>

          <section className="relative bg-background px-[1.25rem] py-24">
            <div className="container mx-auto px-4">
              <PortalSupportSection
                initialMessages={supportThread.messages}
                initialProgressId={supportThread.progressId}
                timeZone={clientTimezone}
                projectId={workspaceProjectId}
                audience={supportAudience}
                allAgreementsSigned={allAgreementsSigned}
              />
            </div>
          </section>

          <section className="relative bg-secondary/30 px-[1.25rem] py-24">
            <div className="container mx-auto px-4">
              <PortalContentUploadSection
                initialUploads={contentUploads}
                timeZone={clientTimezone}
                projectId={workspaceProjectId}
                allAgreementsSigned={allAgreementsSigned}
              />
            </div>
          </section>
        </>
      ) : !showClientConsultationRequests ? (
        <>
          <section className="relative bg-background px-[1.25rem] py-24">
            <div className="container mx-auto px-4">
              <PortalAgreementSection
                clientName={clientName}
                clientProfile={clientProfile}
                clientTimezone={clientTimezone}
                agreements={agreements}
                showSignedAgreementNotice={!consultationRequestId}
                readOnly={Boolean(consultationRequestId)}
                consultationRequestId={consultationRequestId}
                initialAccordionCollapsed={showAdminProjectControls}
                showAddAgreementButton={showAdminProjectControls}
                showCompleteProjectButton={showAdminProjectControls}
                projectId={adminProjectId}
                projectStatus={adminProjectStatus}
              />
            </div>
          </section>

          {agreementStatus.signed ? (
            <>
              <section className="relative bg-secondary/30 px-[1.25rem] py-24">
                <div className="container mx-auto px-4">
                  <PortalProjectTimeline
                    projects={projectTimelines}
                    referenceNow={timelineReferenceNow}
                  />
                </div>
              </section>

              <section className="relative bg-background px-[1.25rem] py-24">
                <div className="container mx-auto px-4">
                  <PortalAmountDueSection
                    amounts={amountSummary}
                    showPaymentActions={!consultationRequestId}
                    ledgerLayout
                    allAgreementsSigned={allAgreementsSigned}
                  />
                </div>
              </section>

              <section className="relative bg-secondary/30 px-[1.25rem] py-24">
                <div className="container mx-auto px-4">
                  <PortalSupportSection
                    initialMessages={supportThread.messages}
                    initialProgressId={supportThread.progressId}
                    timeZone={clientTimezone}
                    projectId={adminProjectId ?? undefined}
                    audience={supportAudience}
                    allAgreementsSigned={allAgreementsSigned}
                  />
                </div>
              </section>

              <section className="relative bg-background px-[1.25rem] py-24">
                <div className="container mx-auto px-4">
                  <PortalContentUploadSection
                    initialUploads={contentUploads}
                    timeZone={clientTimezone}
                    readOnly={Boolean(consultationRequestId)}
                    consultationRequestId={consultationRequestId}
                    projectId={adminProjectId}
                    allAgreementsSigned={allAgreementsSigned}
                    showCompleteProjectButton={showAdminProjectControls}
                    projectStatus={adminProjectStatus}
                  />
                </div>
              </section>
            </>
          ) : null}
        </>
      ) : null}
    </>
  );
}

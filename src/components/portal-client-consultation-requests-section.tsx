import { PortalConsultationRequestsAccordion } from '@/components/portal-consultation-requests-accordion';
import type {
  PortalConsultationRequestDetail,
  PortalConsultationRequestLinkedProject,
} from '@/lib/portal-consultation-requests-data';
import { PORTAL_CLIENT_DASHBOARD_PATH } from '@/lib/portal-role-data';
import type { PortalClientProfile } from '@/lib/portal-user';

type PortalClientConsultationRequestsSectionProps = {
  requests: PortalConsultationRequestDetail[];
  linkedProjects?: PortalConsultationRequestLinkedProject[];
  clientProfile: PortalClientProfile;
  clientTimezone: string | null;
};

export function PortalClientConsultationRequestsSection({
  requests,
  linkedProjects,
  clientProfile,
  clientTimezone,
}: PortalClientConsultationRequestsSectionProps) {
  return (
    <section
      className="relative bg-background px-[1.25rem] py-24"
      aria-labelledby="portal-client-projects-heading"
    >
      <div className="container mx-auto px-4">
        <h2 id="portal-client-projects-heading" className="mb-6 text-2xl font-bold text-foreground">
          Your Projects
        </h2>

        <PortalConsultationRequestsAccordion
          requests={requests}
          linkedProjects={linkedProjects}
          projectDashboardBasePath={PORTAL_CLIENT_DASHBOARD_PATH}
          clientProfile={clientProfile}
          clientTimezone={clientTimezone}
          startCollapsed
        />
      </div>
    </section>
  );
}

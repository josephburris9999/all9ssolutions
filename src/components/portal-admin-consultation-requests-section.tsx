import { PortalConsultationRequestsAccordion } from '@/components/portal-consultation-requests-accordion';
import type { PortalConsultationRequestDetail } from '@/lib/portal-consultation-requests-data';

type PortalAdminConsultationRequestsSectionProps = {
  requests: PortalConsultationRequestDetail[];
  defaultOpenRequestId?: string | null;
};

export function PortalAdminConsultationRequestsSection({
  requests,
  defaultOpenRequestId,
}: PortalAdminConsultationRequestsSectionProps) {
  return (
    <section
      className="relative bg-secondary/30 px-[1.25rem] py-24"
      aria-labelledby="portal-consultation-requests-heading"
    >
      <div className="container mx-auto px-4">
        <h2 id="portal-consultation-requests-heading" className="mb-2 text-2xl font-bold text-foreground">
          Requests
        </h2>
        <p className="mb-6 max-w-2xl text-muted-foreground">
          All consultation requests for this client. Each request may have at most one linked project.
        </p>

        <PortalConsultationRequestsAccordion
          requests={requests}
          defaultOpenRequestId={defaultOpenRequestId}
        />
      </div>
    </section>
  );
}

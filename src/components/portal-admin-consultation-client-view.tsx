import Link from 'next/link';
import { PortalAdminConsultationRequestsPanel } from '@/components/portal-admin-consultation-requests-panel';
import type { PortalAdminConsultationClientDetail } from '@/lib/portal-admin-client-display';
type PortalAdminConsultationClientViewProps = {
  client: PortalAdminConsultationClientDetail;
};

export async function PortalAdminConsultationClientView({ client }: PortalAdminConsultationClientViewProps) {
  const pendingCount = client.requests.filter((request) => !request.projectId).length;

  return (
    <>
      <section className="relative overflow-hidden bg-background px-[1.25rem] pb-16 pt-28 md:pb-20 md:pt-32">
        <div className="iso-neon-grid-layer" aria-hidden>
          <div className="iso-neon-grid-layer-drift" />
        </div>
        <div className="absolute top-0 left-1/2 z-[1] h-[1px] w-full -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="container relative z-10 mx-auto px-4">
          <p className="mb-4">
            <Link
              href="/portal/admin/clients/consultations"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Back to Consultations
            </Link>
          </p>
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {client.name.trim() || 'Client'}
          </h1>
          {pendingCount > 0 ? (
            <p className="mb-8 text-lg text-muted-foreground">
              <span className="text-foreground">{pendingCount}</span> request
              {pendingCount === 1 ? '' : 's'} without a project
            </p>
          ) : (
            <div className="mb-8" aria-hidden />
          )}
        </div>
        <div className="absolute bottom-0 left-1/2 z-[1] h-[1px] w-full -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      </section>

      <section
        className="relative bg-secondary/30 px-[1.25rem] py-24"
        aria-labelledby="portal-consultation-requests-heading"
      >
        <div className="container mx-auto px-4">
          <h2 id="portal-consultation-requests-heading" className="mb-2 text-2xl font-bold text-foreground">
            Requests
          </h2>
          <p className="mb-6 max-w-2xl text-muted-foreground">
            Select a consultation request and create a project. Each request can have at most one project. After
            creating a project, manage the client under Current Clients.
          </p>

          <PortalAdminConsultationRequestsPanel
            requests={client.requests}
            defaultOpenRequestId={
              client.requests.find((request) => !request.projectId)?.id ?? client.primaryConsultationRequestId
            }
          />
        </div>
      </section>
    </>
  );
}

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PortalAdminCurrentProjectWorkspaceSections } from '@/components/portal-admin-current-project-workspace';
import { PortalAdminCurrentProjectsPanel } from '@/components/portal-admin-current-projects-panel';
import { getPortalAdminCurrentClients } from '@/lib/portal-admin-consultations';
import { loadPortalAdminCurrentProjectWorkspace } from '@/lib/portal-admin-current-project-workspace';
import { getPortalSession } from '@/lib/portal-auth';
import { getPortalAdminSignedInDisplayName } from '@/lib/portal-admin-session-display';

export const metadata: Metadata = {
  title: 'Current Clients | Admin Portal | all9s Solutions',
  description: 'Clients with active projects in the all9s Solutions admin portal.',
};

type PortalAdminCurrentClientsPageProps = {
  searchParams: Promise<{ client?: string }>;
};

export default async function PortalAdminCurrentClientsPage({
  searchParams,
}: PortalAdminCurrentClientsPageProps) {
  const { client: selectedConsultationId } = await searchParams;
  const [session, clients] = await Promise.all([getPortalSession(), getPortalAdminCurrentClients()]);
  const displayName = session ? await getPortalAdminSignedInDisplayName() : 'Admin';

  const workspace =
    selectedConsultationId != null && selectedConsultationId.length > 0
      ? await loadPortalAdminCurrentProjectWorkspace(selectedConsultationId)
      : null;

  const selectedId =
    workspace != null && selectedConsultationId != null && selectedConsultationId.length > 0
      ? selectedConsultationId
      : null;

  return (
    <>
      <section className="relative overflow-hidden bg-background px-[1.25rem] pb-16 pt-8 md:pb-20 md:pt-12">
        <div className="iso-neon-grid-layer" aria-hidden>
          <div className="iso-neon-grid-layer-drift" />
        </div>
        <div className="absolute top-0 left-1/2 z-[1] h-[1px] w-full -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="container relative z-10 mx-auto px-4">
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">Current Projects</h1>
          <p className="mb-8 text-lg text-muted-foreground">
            Signed in as <span className="text-foreground">{displayName}</span>
          </p>
          <div className="max-w-2xl space-y-4 text-lg leading-relaxed text-muted-foreground">
            <p>Clients with at least one active project in progress. Select a project to review its workspace.</p>
          </div>
        </div>
        <div className="absolute bottom-0 left-1/2 z-[1] h-[1px] w-full -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      </section>

      <section className="relative bg-background px-[1.25rem] py-24">
        <div className="container mx-auto px-4">
          <Suspense fallback={<p className="text-sm text-muted-foreground">Loading projects…</p>}>
            <PortalAdminCurrentProjectsPanel clients={clients} selectedConsultationId={selectedId} />
          </Suspense>
        </div>
      </section>

      {workspace ? <PortalAdminCurrentProjectWorkspaceSections workspace={workspace} /> : null}
    </>
  );
}

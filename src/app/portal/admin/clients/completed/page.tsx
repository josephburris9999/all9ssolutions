import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PortalAdminCompletedProjectWorkspaceSections } from '@/components/portal-admin-completed-project-workspace';
import { PortalAdminCompletedProjectsPanel } from '@/components/portal-admin-completed-projects-panel';
import { getPortalAdminCompletedClients } from '@/lib/portal-admin-consultations';
import { loadPortalAdminCompletedProjectWorkspace } from '@/lib/portal-admin-completed-project-workspace';
import { getPortalSession } from '@/lib/portal-auth';
import { getPortalAdminSignedInDisplayName } from '@/lib/portal-admin-session-display';

export const metadata: Metadata = {
  title: 'Completed Clients | Admin Portal | all9s Solutions',
  description: 'Clients with completed projects in the all9s Solutions admin portal.',
};

type PortalAdminCompletedClientsPageProps = {
  searchParams: Promise<{ client?: string; project?: string }>;
};

export default async function PortalAdminCompletedClientsPage({
  searchParams,
}: PortalAdminCompletedClientsPageProps) {
  const { client: selectedConsultationId, project: selectedProjectId } = await searchParams;
  const [session, clients] = await Promise.all([getPortalSession(), getPortalAdminCompletedClients()]);
  const displayName = session ? await getPortalAdminSignedInDisplayName() : 'Admin';

  const workspace =
    selectedConsultationId != null && selectedConsultationId.length > 0
      ? await loadPortalAdminCompletedProjectWorkspace(
          selectedConsultationId,
          selectedProjectId ?? null
        )
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
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">Completed</h1>
          <p className="mb-8 text-lg text-muted-foreground">
            Signed in as <span className="text-foreground">{displayName}</span>
          </p>
          <div className="max-w-2xl space-y-4 text-lg leading-relaxed text-muted-foreground">
            <p>Clients with at least one completed project. Select a project to review its record.</p>
          </div>
        </div>
        <div className="absolute bottom-0 left-1/2 z-[1] h-[1px] w-full -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      </section>

      <section className="relative bg-background px-[1.25rem] py-24">
        <div className="container mx-auto px-4">
          <Suspense fallback={<p className="text-sm text-muted-foreground">Loading projects…</p>}>
            <PortalAdminCompletedProjectsPanel clients={clients} selectedConsultationId={selectedId} />
          </Suspense>
        </div>
      </section>

      {workspace ? <PortalAdminCompletedProjectWorkspaceSections workspace={workspace} /> : null}
    </>
  );
}

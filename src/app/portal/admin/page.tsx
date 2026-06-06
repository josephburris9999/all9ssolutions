import type { Metadata } from 'next';
import { PortalAdminToolsSection } from '@/components/portal-admin-tools-section';
import { getPortalSession } from '@/lib/portal-auth';
import { getPortalAdminSignedInDisplayName } from '@/lib/portal-admin-session-display';

export const metadata: Metadata = {
  title: 'Admin Portal | all9s Solutions',
  description: 'Administrative portal for all9s Solutions staff.',
};

export default async function PortalAdminPage() {
  const session = await getPortalSession();
  const displayName = session ? await getPortalAdminSignedInDisplayName() : 'Admin';

  return (
    <>
      <section className="relative overflow-hidden bg-background px-[1.25rem] pb-16 pt-8 md:pb-20 md:pt-12">
        <div className="iso-neon-grid-layer" aria-hidden>
          <div className="iso-neon-grid-layer-drift" />
        </div>
        <div className="absolute top-0 left-1/2 z-[1] h-[1px] w-full -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="container relative z-10 mx-auto px-4">
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">Admin Portal</h1>
          <p className="mb-8 text-lg text-muted-foreground">
            Signed in as <span className="text-foreground">{displayName}</span>
          </p>
          <div className="max-w-2xl space-y-4 text-lg leading-relaxed text-muted-foreground">
            <p>
              Manage client accounts, review portal activity, and respond to client messages from this workspace.
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-1/2 z-[1] h-[1px] w-full -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      </section>

      <section className="relative bg-background px-[1.25rem] py-24">
        <div className="container mx-auto px-4">
          <PortalAdminToolsSection />
        </div>
      </section>
    </>
  );
}

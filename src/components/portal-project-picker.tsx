import Link from 'next/link';
import { portalProjectDashboardHref, type PortalProjectOption } from '@/lib/portal-projects';

type PortalProjectPickerProps = {
  projects: PortalProjectOption[];
  basePath: string;
  title?: string;
  description?: string;
  /** Admin portal: signed-in administrator shown above the project list. */
  signedInDisplayName?: string;
};

function formatProjectStatus(status: string): string {
  return status
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function PortalProjectPicker({
  projects,
  basePath,
  title = 'Select a project',
  description = 'Choose which project you want to view in the portal.',
  signedInDisplayName,
}: PortalProjectPickerProps) {
  return (
    <main className="min-h-screen">
      <section className="relative overflow-hidden bg-background px-[1.25rem] pb-16 pt-28 md:pb-20 md:pt-32">
        <div className="iso-neon-grid-layer" aria-hidden>
          <div className="iso-neon-grid-layer-drift" />
        </div>
        <div className="absolute top-0 left-1/2 z-[1] h-[1px] w-full -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="container relative z-10 mx-auto px-4">
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">{title}</h1>
          {signedInDisplayName ? (
            <p className="mb-4 text-lg text-muted-foreground">
              Signed in as <span className="text-foreground">{signedInDisplayName}</span>
            </p>
          ) : null}
          <p className="mb-8 max-w-2xl text-lg text-muted-foreground">{description}</p>

          <ul className="max-w-2xl space-y-3">
            {projects.map((project) => (
              <li key={project.id}>
                <Link
                  href={portalProjectDashboardHref(basePath, project.id)}
                  className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-5 py-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  <span className="font-medium text-foreground">{project.title}</span>
                  <span className="shrink-0 text-sm text-muted-foreground">
                    {formatProjectStatus(project.status)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="absolute bottom-0 left-1/2 z-[1] h-[1px] w-full -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      </section>
    </main>
  );
}

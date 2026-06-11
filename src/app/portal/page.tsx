import type { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { PortalLoginForm } from '@/components/portal-login-form';
import { getPortalSession } from '@/lib/portal-auth';
import { ensureClientPortalAccess } from '@/lib/portal-client-access';
import { getPortalHomePath, isPortalAdminRole, PORTAL_CLIENT_DASHBOARD_PATH } from '@/lib/portal-role-data';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Client Portal | all9s Solutions',
  description:
    'Secure client portal for progress updates, shared documents, and support from all9s Solutions.',
};

const portalFeatures = [
  {
    title: 'Progress visibility',
    description:
      'Track milestones, deliverables, and status updates for active engagements in one place.',
  },
  {
    title: 'Shared documents',
    description:
      'Access proposals, specifications, reports, and other files shared by your team.',
  },
  {
    title: 'Support requests',
    description:
      'Submit and follow maintenance or support requests tied to your systems and services.',
  },
] as const;

export default async function PortalPage() {
  const session = await getPortalSession();
  if (session) {
    if (isPortalAdminRole(session.role)) {
      redirect(getPortalHomePath(session.role));
    }

    await ensureClientPortalAccess(session);
    redirect(session.mustChangePassword ? PORTAL_CLIENT_DASHBOARD_PATH : getPortalHomePath(session.role));
  }

  return (
    <main className="min-h-screen">
      <section className="relative overflow-hidden bg-background px-[1.25rem] pb-16 pt-28 md:pb-20 md:pt-32">
        <div className="iso-neon-grid-layer" aria-hidden>
          <div className="iso-neon-grid-layer-drift" />
        </div>
        <div className="absolute top-0 left-1/2 z-[1] h-[1px] w-full -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="container relative z-10 mx-auto px-4">
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">Client Portal</h1>
          <p className="mb-8 text-lg text-muted-foreground md:text-xl">
            A secure workspace for all9s Solutions clients
          </p>
          <div className="max-w-2xl space-y-4 text-lg leading-relaxed text-muted-foreground">
            <p>
              The client portal gives your team a dedicated place to collaborate with all9s Solutions—view progress
              updates, upload content, and stay aligned as work moves forward.
            </p>
            <p>
              Portal access is provided to active clients. If you need an account or help signing in,{' '}
              <a
                href="mailto:hello@all9ssolutions.com?subject=Contact%20all9s%20Solutions&body=Tell%20us%20how%20we%20can%20help."
                className="font-medium text-foreground transition-colors hover:text-primary"
              >
                Contact Us
              </a>{' '}
              and we will get you set up.
            </p>
          </div>
        </div>
      </section>

      <Suspense fallback={null}>
        <PortalLoginForm requirePasswordChange={false} />
      </Suspense>

      <section className="relative overflow-hidden bg-secondary/30 px-[1.25rem] py-24">
        <div className="absolute top-0 left-1/2 h-[1px] w-full -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="container relative z-10 mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-2 text-3xl font-bold text-foreground">What you can do</h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Tools and information available through your portal account
            </p>
          </div>
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
            {portalFeatures.map(({ title, description }) => (
              <Card key={title} className="border-border bg-background/80">
                <CardHeader>
                  <CardTitle className="text-xl text-foreground">{title}</CardTitle>
                  <CardDescription className="text-base leading-relaxed">{description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

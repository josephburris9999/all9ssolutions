import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PortalAdminClientPortalView } from '@/components/portal-admin-client-portal-view';
import { getPortalAdminCompletedClientById } from '@/lib/portal-admin-consultations';

type PortalAdminCompletedClientDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ project?: string }>;
};

export async function generateMetadata({ params }: PortalAdminCompletedClientDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const client = await getPortalAdminCompletedClientById(id);

  return {
    title: client
      ? `${client.name} | Completed Clients | Admin Portal | all9s Solutions`
      : 'Completed Client | Admin Portal | all9s Solutions',
    description: 'Client portal view for all9s Solutions admin portal.',
  };
}

export default async function PortalAdminCompletedClientDetailPage({
  params,
  searchParams,
}: PortalAdminCompletedClientDetailPageProps) {
  const { id } = await params;
  const { project: selectedProjectId } = await searchParams;
  const client = await getPortalAdminCompletedClientById(id);

  if (!client) {
    notFound();
  }

  return (
    <PortalAdminClientPortalView
      client={client}
      basePath={`/portal/admin/clients/completed/${id}`}
      selectedProjectId={selectedProjectId}
    />
  );
}

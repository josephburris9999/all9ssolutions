import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PortalAdminClientPortalView } from '@/components/portal-admin-client-portal-view';
import { getPortalAdminCurrentClientById } from '@/lib/portal-admin-consultations';

type PortalAdminCurrentClientDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ project?: string }>;
};

export async function generateMetadata({ params }: PortalAdminCurrentClientDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const client = await getPortalAdminCurrentClientById(id);

  return {
    title: client
      ? `${client.name} | Current Clients | Admin Portal | all9s Solutions`
      : 'Current Client | Admin Portal | all9s Solutions',
    description: 'Client portal view for all9s Solutions admin portal.',
  };
}

export default async function PortalAdminCurrentClientDetailPage({
  params,
  searchParams,
}: PortalAdminCurrentClientDetailPageProps) {
  const { id } = await params;
  const { project: selectedProjectId } = await searchParams;
  const client = await getPortalAdminCurrentClientById(id);

  if (!client) {
    notFound();
  }

  return (
    <PortalAdminClientPortalView
      client={client}
      basePath={`/portal/admin/clients/current/${id}`}
      selectedProjectId={selectedProjectId}
    />
  );
}

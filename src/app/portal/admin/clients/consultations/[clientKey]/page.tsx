import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PortalAdminConsultationClientView } from '@/components/portal-admin-consultation-client-view';
import { getPortalAdminConsultationClientByKey } from '@/lib/portal-admin-consultations';

type PortalAdminConsultationClientPageProps = {
  params: Promise<{ clientKey: string }>;
};

export async function generateMetadata({ params }: PortalAdminConsultationClientPageProps): Promise<Metadata> {
  const { clientKey } = await params;
  const client = await getPortalAdminConsultationClientByKey(decodeURIComponent(clientKey));

  return {
    title: client
      ? `${client.name} | Consultations | Admin Portal | all9s Solutions`
      : 'Consultation | Admin Portal | all9s Solutions',
    description: 'Client consultation requests for all9s Solutions admin portal.',
  };
}

export default async function PortalAdminConsultationClientPage({ params }: PortalAdminConsultationClientPageProps) {
  const { clientKey } = await params;
  const client = await getPortalAdminConsultationClientByKey(decodeURIComponent(clientKey));

  if (!client) {
    notFound();
  }

  return <PortalAdminConsultationClientView client={client} />;
}

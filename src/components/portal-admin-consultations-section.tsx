import { PortalAdminManualConsultationForm } from '@/components/portal-admin-manual-consultation-form';
import { PortalAdminConsultationsTable } from '@/components/portal-admin-consultations-table';
import type { PortalAdminConsultationClientRow } from '@/lib/portal-admin-client-display';

type PortalAdminConsultationsSectionProps = {
  clients: PortalAdminConsultationClientRow[];
};

export function PortalAdminConsultationsSection({ clients }: PortalAdminConsultationsSectionProps) {
  return (
    <>
      <PortalAdminManualConsultationForm />
      <PortalAdminConsultationsTable
        clients={clients}
        emptyMessage="No clients with consultation requests awaiting a project."
      />
    </>
  );
}

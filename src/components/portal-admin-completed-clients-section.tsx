import { PortalAdminClientsTable } from '@/components/portal-admin-clients-table';
import type { PortalAdminConsultationRow } from '@/lib/portal-admin-client-display';

type PortalAdminCompletedClientsSectionProps = {
  clients: PortalAdminConsultationRow[];
};

export function PortalAdminCompletedClientsSection({ clients }: PortalAdminCompletedClientsSectionProps) {
  return (
    <PortalAdminClientsTable
      rows={clients}
      detailPathPrefix="/portal/admin/clients/completed"
      emptyMessage="No clients with completed projects."
    />
  );
}

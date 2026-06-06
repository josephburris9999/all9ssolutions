'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { PortalAdminClientsTable } from '@/components/portal-admin-clients-table';
import { getPortalAdminCompletedClientsPageHref } from '@/lib/portal-admin-client-display';
import type { PortalAdminConsultationRow } from '@/lib/portal-admin-client-display';

type PortalAdminCompletedProjectsPanelProps = {
  clients: PortalAdminConsultationRow[];
  selectedConsultationId?: string | null;
};

export function PortalAdminCompletedProjectsPanel({
  clients,
  selectedConsultationId = null,
}: PortalAdminCompletedProjectsPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleSelectRow(rowId: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (selectedConsultationId === rowId) {
      params.delete('client');
      params.delete('project');
    } else {
      params.set('client', rowId);
      params.delete('project');
    }

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <PortalAdminClientsTable
      rows={clients}
      detailPathPrefix="/portal/admin/clients/completed"
      getRowDetailHref={(row) => getPortalAdminCompletedClientsPageHref(row.id)}
      emptyMessage="No clients with completed projects."
      showSecondaryColumn={false}
      showPhoneColumn={false}
      scrollContainerClassName="max-sm:overflow-x-hidden"
      selectionMode
      selectedRowId={selectedConsultationId}
      onSelectRow={handleSelectRow}
    />
  );
}

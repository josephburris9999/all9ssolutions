'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { PortalAdminClientsTable } from '@/components/portal-admin-clients-table';
import type { PortalAdminConsultationRow } from '@/lib/portal-admin-client-display';

type PortalAdminCurrentProjectsPanelProps = {
  clients: PortalAdminConsultationRow[];
  selectedConsultationId?: string | null;
};

export function PortalAdminCurrentProjectsPanel({
  clients,
  selectedConsultationId = null,
}: PortalAdminCurrentProjectsPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleSelectRow(rowId: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (selectedConsultationId === rowId) {
      params.delete('client');
    } else {
      params.set('client', rowId);
    }

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <PortalAdminClientsTable
      rows={clients}
      detailPathPrefix="/portal/admin/clients/current"
      emptyMessage="No current clients with active projects."
      secondaryColumn="project"
      showPhoneColumn={false}
      scrollContainerClassName="max-sm:overflow-x-hidden"
      selectionMode
      selectedRowId={selectedConsultationId}
      onSelectRow={handleSelectRow}
    />
  );
}

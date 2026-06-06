import { redirect } from 'next/navigation';
import { getPortalAdminCompletedClientsPageHref } from '@/lib/portal-admin-client-display';

type PortalAdminCompletedClientDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ project?: string }>;
};

/** Legacy detail URLs redirect to the Completed list workspace (`?client=`). */
export default async function PortalAdminCompletedClientDetailPage({
  params,
  searchParams,
}: PortalAdminCompletedClientDetailPageProps) {
  const { id } = await params;
  const { project: selectedProjectId } = await searchParams;

  redirect(getPortalAdminCompletedClientsPageHref(id, selectedProjectId ?? null));
}

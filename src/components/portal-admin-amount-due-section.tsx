'use client';

import { PortalAmountDueSection } from '@/components/portal-amount-due-section';
import type { PortalAmountSummary } from '@/lib/portal-amount-due-data';

type PortalAdminAmountDueSectionProps = {
  amounts: PortalAmountSummary;
  projectId: string;
};

/** Admin Current Projects amount due — matches client portal layout; extend here for admin-only controls. */
export function PortalAdminAmountDueSection({
  amounts,
  projectId,
}: PortalAdminAmountDueSectionProps) {
  void projectId;

  return <PortalAmountDueSection amounts={amounts} showPaymentActions={false} ledgerLayout />;
}

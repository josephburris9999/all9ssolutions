'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useSubmitGuard } from '@/hooks/use-submit-guard';
import { usePortalAdminCategoryCountsAfterMutation } from '@/hooks/use-portal-admin-category-counts-after-mutation';
import { useOptionalRefreshPortalAdminUnreadMessages } from '@/contexts/portal-admin-unread-messages-context';
import { getPortalAdminCurrentClientsPageHref } from '@/lib/portal-admin-client-display';
import type { PortalAdminClientCategoryCounts } from '@/lib/portal-admin-nav';
import { cn } from '@/lib/utils';

type PortalAdminReactivateProjectButtonProps = {
  projectId: string;
  projectStatus?: string;
  className?: string;
};

export function PortalAdminReactivateProjectButton({
  projectId,
  projectStatus,
  className,
}: PortalAdminReactivateProjectButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const syncCategoryCounts = usePortalAdminCategoryCountsAfterMutation();
  const refreshUnreadMessages = useOptionalRefreshPortalAdminUnreadMessages();
  const { isSubmitting, runGuardedSubmit } = useSubmitGuard();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isCompleted = projectStatus === 'COMPLETED';

  async function handleSave() {
    await runGuardedSubmit(async () => {
      const res = await fetch(
        `/api/portal/admin/projects/${encodeURIComponent(projectId)}/reactivate`,
        { method: 'POST' }
      );
      const payload = (await res.json()) as {
        ok?: boolean;
        error?: string;
        categoryCounts?: PortalAdminClientCategoryCounts;
        consultationRequestId?: string;
      };

      if (!res.ok || !payload.ok || !payload.consultationRequestId) {
        toast({
          variant: 'destructive',
          title: 'Could not make project current',
          description: payload.error ?? 'Please try again.',
        });
        return;
      }

      toast({
        title: 'Project is current',
        description: 'This project has been moved back to Current Projects.',
      });

      await syncCategoryCounts(payload.categoryCounts);
      void refreshUnreadMessages?.();

      setConfirmOpen(false);
      router.push(
        getPortalAdminCurrentClientsPageHref(payload.consultationRequestId, projectId)
      );
      router.refresh();
    }).catch(() => {
      toast({
        variant: 'destructive',
        title: 'Could not make project current',
        description: 'Please check your connection and try again.',
      });
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className={cn('shrink-0', className)}
        disabled={!isCompleted || isSubmitting}
        onClick={() => setConfirmOpen(true)}
      >
        Make Current
      </Button>
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Make current?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will change the project status back to active. The client will appear under
            Current Projects again.
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" disabled={isSubmitting} onClick={() => void handleSave()}>
              {isSubmitting ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

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
import type { PortalAdminClientCategoryCounts } from '@/lib/portal-admin-nav';
import { cn } from '@/lib/utils';

type PortalAdminCompleteProjectButtonProps = {
  projectId: string;
  projectStatus?: string;
  className?: string;
};

export function PortalAdminCompleteProjectButton({
  projectId,
  projectStatus,
  className,
}: PortalAdminCompleteProjectButtonProps) {
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
        `/api/portal/admin/projects/${encodeURIComponent(projectId)}/complete`,
        { method: 'POST' }
      );
      const payload = (await res.json()) as {
        ok?: boolean;
        error?: string;
        categoryCounts?: PortalAdminClientCategoryCounts;
      };

      if (!res.ok || !payload.ok) {
        toast({
          variant: 'destructive',
          title: 'Could not complete project',
          description: payload.error ?? 'Please try again.',
        });
        return;
      }

      toast({
        title: 'Project completed',
        description: 'This project has been moved to Completed clients.',
      });

      await syncCategoryCounts(payload.categoryCounts);
      void refreshUnreadMessages?.();

      setConfirmOpen(false);
      router.push('/portal/admin/clients/current');
      router.refresh();
    }).catch(() => {
      toast({
        variant: 'destructive',
        title: 'Could not complete project',
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
        disabled={isCompleted || isSubmitting}
        onClick={() => setConfirmOpen(true)}
      >
        Complete Project
      </Button>
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete project?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will change the project status to completed. The client will no longer appear under
            Current Projects.
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

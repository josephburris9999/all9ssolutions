'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  estimatedCompletionIsoToDateInput,
  getMinProjectDateInputValue,
  isEstimatedCompletionDateAllowed,
  PROJECT_ESTIMATED_COMPLETION_PAST_DATE_MESSAGE,
  PROJECT_ESTIMATED_COMPLETION_REQUIRED_MESSAGE,
} from '@/lib/portal-project-estimated-completion';
import type { PortalProjectTimelineData } from '@/lib/portal-timeline-data';
import { useToast } from '@/hooks/use-toast';
import { useSubmitGuard } from '@/hooks/use-submit-guard';

type PortalAdminUpdateEstimatedCompletionProps = {
  projectId: string;
  projects: PortalProjectTimelineData[];
  referenceNow: string;
};

export function PortalAdminUpdateEstimatedCompletion({
  projectId,
  projects,
  referenceNow,
}: PortalAdminUpdateEstimatedCompletionProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { isSubmitting, runGuardedSubmit } = useSubmitGuard();
  const [updateCompletionOpen, setUpdateCompletionOpen] = useState(false);
  const [estimatedCompletionDate, setEstimatedCompletionDate] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);

  const minCompletionDate = useMemo(
    () => getMinProjectDateInputValue(new Date(referenceNow)),
    [referenceNow]
  );

  const timelineProject =
    projects.find((project) => project.projectId === projectId) ?? projects[0] ?? null;

  useEffect(() => {
    if (!updateCompletionOpen || !timelineProject) {
      return;
    }

    setEstimatedCompletionDate(
      estimatedCompletionIsoToDateInput(timelineProject.estimatedCompletionAt)
    );
    setFieldError(null);
  }, [timelineProject, updateCompletionOpen]);

  async function handleSaveEstimatedCompletion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!timelineProject) {
      return;
    }

    const trimmed = estimatedCompletionDate.trim();
    if (!trimmed) {
      setFieldError(PROJECT_ESTIMATED_COMPLETION_REQUIRED_MESSAGE);
      return;
    }

    if (!isEstimatedCompletionDateAllowed(trimmed, new Date(referenceNow))) {
      setFieldError(PROJECT_ESTIMATED_COMPLETION_PAST_DATE_MESSAGE);
      return;
    }

    setFieldError(null);

    await runGuardedSubmit(async () => {
      const res = await fetch(
        `/api/portal/admin/projects/${encodeURIComponent(timelineProject.projectId)}/estimated-completion`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estimatedCompletionDate: trimmed }),
        }
      );

      const payload = (await res.json()) as { ok?: boolean; error?: string };

      if (!res.ok || !payload.ok) {
        toast({
          variant: 'destructive',
          title: 'Unable to update completion date',
          description: payload.error ?? 'Please try again.',
        });
        return;
      }

      toast({
        title: 'Estimated completion updated',
        description: 'The project timeline will reflect the new completion date.',
      });
      setUpdateCompletionOpen(false);
      router.refresh();
    }).catch(() => {
      toast({
        variant: 'destructive',
        title: 'Unable to update completion date',
        description: 'Network error. Please try again.',
      });
    });
  }

  if (!timelineProject) {
    return null;
  }

  return (
    <div>
      <Button
        type="button"
        variant="outline"
        className="mt-2 w-full"
        onClick={() => setUpdateCompletionOpen(true)}
      >
        Update Estimated Completion
      </Button>
      <Dialog open={updateCompletionOpen} onOpenChange={setUpdateCompletionOpen}>
        <DialogContent>
          <form onSubmit={handleSaveEstimatedCompletion}>
            <DialogHeader>
              <DialogTitle>Update estimated completion</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 py-4">
              <Label htmlFor="portal-update-estimated-completion-date">Estimated completion</Label>
              <Input
                id="portal-update-estimated-completion-date"
                type="date"
                min={minCompletionDate}
                value={estimatedCompletionDate}
                required
                disabled={isSubmitting}
                onChange={(event) => {
                  setEstimatedCompletionDate(event.target.value);
                  if (fieldError) {
                    setFieldError(null);
                  }
                }}
                aria-invalid={fieldError ? true : undefined}
              />
              {fieldError ? <p className="text-sm text-destructive">{fieldError}</p> : null}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => setUpdateCompletionOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || estimatedCompletionDate.trim().length === 0}>
                {isSubmitting ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

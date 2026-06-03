'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CONSULTATION_NAME_MAX_LENGTH } from '@/lib/field-lengths';
import { portalAdminNameSchema } from '@/lib/portal-admin-name-schema';
import { useToast } from '@/hooks/use-toast';
import { useSubmitGuard } from '@/hooks/use-submit-guard';

type PortalClientNameFieldProps = {
  consultationRequestId: string;
  initialName: string;
};

function normalizeName(value: string): string {
  return value.trim();
}

function formatNameDisplay(name: string): string {
  return name.length > 0 ? name : '—';
}

export function PortalClientNameField({
  consultationRequestId,
  initialName,
}: PortalClientNameFieldProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { isSubmitting: isSaving, runGuardedSubmit } = useSubmitGuard();
  const nameInputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [savedName, setSavedName] = React.useState(() => normalizeName(initialName));
  const [draftName, setDraftName] = React.useState(() => normalizeName(initialName));
  const [fieldError, setFieldError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setSavedName(normalizeName(initialName));
  }, [initialName]);

  React.useEffect(() => {
    if (open) {
      setDraftName(savedName);
      setFieldError(null);
    }
  }, [open, savedName]);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    const animationFrameId = window.requestAnimationFrame(() => {
      nameInputRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [open]);

  function resetDraft() {
    setDraftName(savedName);
    setFieldError(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      resetDraft();
    }

    setOpen(nextOpen);
  }

  function handleCancel() {
    resetDraft();
    setOpen(false);
  }

  async function handleSave() {
    if (draftName === savedName) {
      setOpen(false);
      return;
    }

    const parsed = portalAdminNameSchema.safeParse({ name: draftName });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? 'Invalid name');
      return;
    }

    await runGuardedSubmit(async () => {
      const response = await fetch(
        `/api/portal/admin/consultations/${encodeURIComponent(consultationRequestId)}/name`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: draftName }),
        }
      );

      let payload: { ok?: boolean; error?: string; name?: string } = {};
      try {
        payload = (await response.json()) as typeof payload;
      } catch {
        // non-JSON response
      }

      if (!response.ok || !payload.ok) {
        toast({
          variant: 'destructive',
          title: 'Could not update name',
          description:
            typeof payload.error === 'string' && payload.error.length > 0
              ? payload.error
              : 'Please try again.',
        });
        return;
      }

      setSavedName(normalizeName(payload.name ?? draftName));
      setOpen(false);
      router.refresh();
      toast({
        title: 'Name updated',
        description: 'The client name was saved.',
      });
    });
  }

  return (
    <>
      <div className="space-y-1">
        <dt className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <span>Name</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
            aria-label="Edit name"
            onClick={() => setOpen(true)}
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
          </Button>
        </dt>
        <dd className="text-base text-foreground">{formatNameDisplay(savedName)}</dd>
      </div>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit name</DialogTitle>
            <DialogDescription>Update the client&apos;s full name.</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="client-name-input">Name</Label>
            <Input
              ref={nameInputRef}
              id="client-name-input"
              value={draftName}
              onChange={(event) => {
                setDraftName(event.target.value);
                if (fieldError) {
                  setFieldError(null);
                }
              }}
              aria-invalid={fieldError ? true : undefined}
              maxLength={CONSULTATION_NAME_MAX_LENGTH}
            />
            {fieldError ? <p className="text-sm text-destructive">{fieldError}</p> : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void handleSave()} disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

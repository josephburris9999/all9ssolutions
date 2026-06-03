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
import { CONSULTATION_COMPANY_MAX_LENGTH } from '@/lib/field-lengths';
import { portalAdminCompanySchema } from '@/lib/portal-admin-company-schema';
import { useToast } from '@/hooks/use-toast';
import { useSubmitGuard } from '@/hooks/use-submit-guard';

type PortalClientCompanyFieldProps = {
  consultationRequestId: string;
  initialCompany: string | null;
};

function normalizeCompany(value: string | null): string {
  return value?.trim() ?? '';
}

function formatCompanyDisplay(company: string): string {
  return company.length > 0 ? company : '—';
}

export function PortalClientCompanyField({
  consultationRequestId,
  initialCompany,
}: PortalClientCompanyFieldProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { isSubmitting: isSaving, runGuardedSubmit } = useSubmitGuard();
  const companyInputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [savedCompany, setSavedCompany] = React.useState(() => normalizeCompany(initialCompany));
  const [draftCompany, setDraftCompany] = React.useState(() => normalizeCompany(initialCompany));
  const [fieldError, setFieldError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setSavedCompany(normalizeCompany(initialCompany));
  }, [initialCompany]);

  React.useEffect(() => {
    if (open) {
      setDraftCompany(savedCompany);
      setFieldError(null);
    }
  }, [open, savedCompany]);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    const animationFrameId = window.requestAnimationFrame(() => {
      companyInputRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [open]);

  function resetDraft() {
    setDraftCompany(savedCompany);
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
    if (draftCompany === savedCompany) {
      setOpen(false);
      return;
    }

    const parsed = portalAdminCompanySchema.safeParse({ company: draftCompany });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? 'Invalid company name');
      return;
    }

    await runGuardedSubmit(async () => {
      const response = await fetch(
        `/api/portal/admin/consultations/${encodeURIComponent(consultationRequestId)}/company`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ company: draftCompany }),
        }
      );

      let payload: { ok?: boolean; error?: string; company?: string | null } = {};
      try {
        payload = (await response.json()) as typeof payload;
      } catch {
        // non-JSON response
      }

      if (!response.ok || !payload.ok) {
        toast({
          variant: 'destructive',
          title: 'Could not update company',
          description:
            typeof payload.error === 'string' && payload.error.length > 0
              ? payload.error
              : 'Please try again.',
        });
        return;
      }

      setSavedCompany(normalizeCompany(payload.company ?? null));
      setOpen(false);
      router.refresh();
      toast({
        title: 'Company updated',
        description: 'The company name was saved.',
      });
    });
  }

  return (
    <>
      <div className="space-y-1">
        <dt className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <span>Company</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
            aria-label="Edit company"
            onClick={() => setOpen(true)}
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
          </Button>
        </dt>
        <dd className="text-base text-foreground">{formatCompanyDisplay(savedCompany)}</dd>
      </div>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit company</DialogTitle>
            <DialogDescription>Update the client&apos;s company name.</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="company-name-input">Company</Label>
            <Input
              ref={companyInputRef}
              id="company-name-input"
              value={draftCompany}
              onChange={(event) => {
                setDraftCompany(event.target.value);
                if (fieldError) {
                  setFieldError(null);
                }
              }}
              aria-invalid={fieldError ? true : undefined}
              maxLength={CONSULTATION_COMPANY_MAX_LENGTH}
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

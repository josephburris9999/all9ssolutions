'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Textarea } from '@/components/ui/textarea';
import {
  PROJECT_AGREEMENT_BODY_MAX_LENGTH,
  PROJECT_AGREEMENT_TITLE_MAX_LENGTH,
} from '@/lib/field-lengths';
import {
  addProjectAgreementFormSchema,
  type AddProjectAgreementFormValues,
} from '@/lib/portal-admin-add-project-agreement-schema';
import { getMinFutureProjectDateInputValue } from '@/lib/portal-project-estimated-completion';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useSubmitGuard } from '@/hooks/use-submit-guard';

type AddProjectAgreementFieldName = keyof AddProjectAgreementFormValues;
type AddProjectAgreementFieldErrors = Partial<Record<AddProjectAgreementFieldName, string>>;

type PortalAdminAddProjectAgreementDialogProps = {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function mapAddProjectAgreementFormErrors(
  issues: { path: (string | number)[]; message: string }[]
): AddProjectAgreementFieldErrors {
  const errors: AddProjectAgreementFieldErrors = {};

  for (const issue of issues) {
    const field = issue.path[0];
    if (typeof field === 'string' && field in addProjectAgreementFormSchema.shape) {
      const key = field as AddProjectAgreementFieldName;
      if (!errors[key]) {
        errors[key] = issue.message;
      }
    }
  }

  return errors;
}

export function PortalAdminAddProjectAgreementDialog({
  projectId,
  open,
  onOpenChange,
}: PortalAdminAddProjectAgreementDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { isSubmitting, runGuardedSubmit } = useSubmitGuard();
  const [agreementTitle, setAgreementTitle] = useState('');
  const [agreementBody, setAgreementBody] = useState('');
  const [estimatedCompletionDate, setEstimatedCompletionDate] = useState('');
  const [amount, setAmount] = useState('');
  const [fieldErrors, setFieldErrors] = useState<AddProjectAgreementFieldErrors>({});
  const minCompletionDate = useMemo(() => getMinFutureProjectDateInputValue(), []);

  function resetForm() {
    setAgreementTitle('');
    setAgreementBody('');
    setEstimatedCompletionDate('');
    setAmount('');
    setFieldErrors({});
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      resetForm();
    }
    onOpenChange(nextOpen);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = addProjectAgreementFormSchema.safeParse({
      agreementTitle,
      agreementBody,
      estimatedCompletionDate,
      amount,
    });

    if (!parsed.success) {
      setFieldErrors(mapAddProjectAgreementFormErrors(parsed.error.issues));
      return;
    }

    setFieldErrors({});

    await runGuardedSubmit(async () => {
      const res = await fetch(
        `/api/portal/admin/projects/${encodeURIComponent(projectId)}/agreements`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agreementTitle: parsed.data.agreementTitle,
            agreementBody: parsed.data.agreementBody,
            estimatedCompletionDate: parsed.data.estimatedCompletionDate,
            amount: parsed.data.amount,
          }),
        }
      );

      const payload = (await res.json()) as {
        ok?: boolean;
        error?: string;
        agreement?: { title?: string };
      };

      if (!res.ok || !payload.ok) {
        toast({
          variant: 'destructive',
          title: 'Could not add agreement',
          description: payload.error ?? 'Please try again.',
        });
        return;
      }

      toast({
        title: 'Agreement added',
        description: payload.agreement?.title
          ? `"${payload.agreement.title}" is ready for the client to review and sign.`
          : 'The client can review and sign the new agreement in their portal.',
      });

      handleOpenChange(false);
      router.refresh();
    }).catch(() => {
      toast({
        variant: 'destructive',
        title: 'Could not add agreement',
        description: 'Please check your connection and try again.',
      });
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Agreement</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="add-agreement-title">Agreement Title</Label>
            <Input
              id="add-agreement-title"
              value={agreementTitle}
              onChange={(event) => {
                setAgreementTitle(event.target.value);
                if (fieldErrors.agreementTitle) {
                  setFieldErrors((current) => ({ ...current, agreementTitle: undefined }));
                }
              }}
              maxLength={PROJECT_AGREEMENT_TITLE_MAX_LENGTH}
              placeholder="Short name the client will see for this agreement"
              required
              aria-invalid={fieldErrors.agreementTitle ? true : undefined}
            />
            {fieldErrors.agreementTitle ? (
              <p className="text-sm text-destructive">{fieldErrors.agreementTitle}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="add-agreement-body">Agreement</Label>
            <Textarea
              id="add-agreement-body"
              value={agreementBody}
              onChange={(event) => {
                setAgreementBody(event.target.value);
                if (fieldErrors.agreementBody) {
                  setFieldErrors((current) => ({ ...current, agreementBody: undefined }));
                }
              }}
              maxLength={PROJECT_AGREEMENT_BODY_MAX_LENGTH}
              required
              rows={8}
              placeholder="Full agreement text the client will review and sign, including scope, deliverables, and payment terms"
              className="min-h-[10rem] resize-y"
              aria-invalid={fieldErrors.agreementBody ? true : undefined}
            />
            <p
              className={cn(
                'text-right text-xs tabular-nums',
                agreementBody.length >= PROJECT_AGREEMENT_BODY_MAX_LENGTH
                  ? 'text-destructive'
                  : 'text-muted-foreground'
              )}
              aria-live="polite"
            >
              {agreementBody.length} / {PROJECT_AGREEMENT_BODY_MAX_LENGTH}
            </p>
            {fieldErrors.agreementBody ? (
              <p className="text-sm text-destructive">{fieldErrors.agreementBody}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="add-agreement-completion">Estimated Completion</Label>
              <Input
                id="add-agreement-completion"
                type="date"
                min={minCompletionDate}
                value={estimatedCompletionDate}
                required
                onChange={(event) => {
                  setEstimatedCompletionDate(event.target.value);
                  if (fieldErrors.estimatedCompletionDate) {
                    setFieldErrors((current) => ({ ...current, estimatedCompletionDate: undefined }));
                  }
                }}
                aria-invalid={fieldErrors.estimatedCompletionDate ? true : undefined}
              />
              {fieldErrors.estimatedCompletionDate ? (
                <p className="text-sm text-destructive">{fieldErrors.estimatedCompletionDate}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-agreement-amount">Amount (USD)</Label>
              <Input
                id="add-agreement-amount"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                placeholder="0.00"
                value={amount}
                required
                onChange={(event) => {
                  setAmount(event.target.value);
                  if (fieldErrors.amount) {
                    setFieldErrors((current) => ({ ...current, amount: undefined }));
                  }
                }}
                aria-invalid={fieldErrors.amount ? true : undefined}
              />
              {fieldErrors.amount ? (
                <p className="text-sm text-destructive">{fieldErrors.amount}</p>
              ) : null}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding…' : 'Add Agreement'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

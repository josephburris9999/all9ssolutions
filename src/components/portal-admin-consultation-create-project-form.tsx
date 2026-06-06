'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getPortalAdminCurrentClientDetailPath } from '@/lib/portal-admin-client-display';
import {
  createProjectFormSchema,
  type CreateProjectFieldName,
} from '@/lib/portal-admin-create-project-schema';
import type { PortalConsultationRequestDetail } from '@/lib/portal-consultation-requests-data';
import {
  PROJECT_AGREEMENT_BODY_MAX_LENGTH,
  PROJECT_AGREEMENT_TITLE_MAX_LENGTH,
  PROJECT_TITLE_MAX_LENGTH,
} from '@/lib/field-lengths';
import { getMinFutureProjectDateInputValue } from '@/lib/portal-project-estimated-completion';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useSubmitGuard } from '@/hooks/use-submit-guard';
import { usePortalAdminCategoryCountsAfterMutation } from '@/hooks/use-portal-admin-category-counts-after-mutation';
import type { PortalAdminClientCategoryCounts } from '@/lib/portal-admin-nav';

type PortalAdminConsultationCreateProjectFormProps = {
  request: PortalConsultationRequestDetail;
};

function defaultProjectTitle(request: PortalConsultationRequestDetail): string {
  const company = request.company?.trim();
  if (company) {
    return company;
  }

  const name = request.name.trim();
  return name ? `${name} project` : 'Client project';
}

type CreateProjectFieldErrors = Partial<Record<CreateProjectFieldName, string>>;

function mapCreateProjectFormErrors(
  issues: { path: (string | number)[]; message: string }[]
): CreateProjectFieldErrors {
  const errors: CreateProjectFieldErrors = {};

  for (const issue of issues) {
    const field = issue.path[0];
    if (typeof field === 'string' && field in createProjectFormSchema.shape) {
      const key = field as CreateProjectFieldName;
      if (!errors[key]) {
        errors[key] = issue.message;
      }
    }
  }

  return errors;
}

export function PortalAdminConsultationCreateProjectForm({
  request,
}: PortalAdminConsultationCreateProjectFormProps) {
  const router = useRouter();
  const syncCategoryCounts = usePortalAdminCategoryCountsAfterMutation();
  const { toast } = useToast();
  const { isSubmitting, runGuardedSubmit } = useSubmitGuard();
  const [title, setTitle] = useState(defaultProjectTitle(request));
  const [agreementTitle, setAgreementTitle] = useState('');
  const [estimatedCompletionDate, setEstimatedCompletionDate] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [amountDue, setAmountDue] = useState('');
  const [agreementBody, setAgreementBody] = useState('');
  const [fieldErrors, setFieldErrors] = useState<CreateProjectFieldErrors>({});
  const minCompletionDate = useMemo(() => getMinFutureProjectDateInputValue(), []);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = createProjectFormSchema.safeParse({
      title,
      agreementTitle,
      estimatedCompletionDate,
      depositAmount,
      amountDue,
      agreementBody,
    });

    if (!parsed.success) {
      setFieldErrors(mapCreateProjectFormErrors(parsed.error.issues));
      return;
    }

    setFieldErrors({});

    await runGuardedSubmit(async () => {
      const res = await fetch(
        `/api/portal/admin/consultations/${encodeURIComponent(request.id)}/project`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: parsed.data.title,
            agreementTitle: parsed.data.agreementTitle,
            agreementBody: parsed.data.agreementBody,
            estimatedCompletionDate: parsed.data.estimatedCompletionDate,
            depositAmount: parsed.data.depositAmount,
            amountDue: parsed.data.amountDue,
          }),
        }
      );

      const payload = (await res.json()) as {
        ok?: boolean;
        error?: string;
        projectId?: string;
        projectTitle?: string;
        temporaryPassword?: string | null;
        emailSent?: boolean;
        emailSkipped?: boolean;
        categoryCounts?: PortalAdminClientCategoryCounts;
      };

      if (!res.ok || !payload.ok) {
        toast({
          variant: 'destructive',
          title: 'Could not create project',
          description: payload.error ?? 'Please try again.',
        });
        return;
      }

      const temporaryPassword =
        typeof payload.temporaryPassword === 'string' && payload.temporaryPassword.length > 0
          ? payload.temporaryPassword
          : null;
      const projectDescription = payload.projectTitle
        ? `"${payload.projectTitle}" is linked to this request.`
        : 'The project is linked to this consultation request.';
      let emailNote = '';
      if (payload.emailSent) {
        emailNote = ' The client was notified by email.';
      } else if (payload.emailSkipped) {
        emailNote = ' Email was not sent because email is not configured.';
      } else {
        emailNote = ' The project notification email could not be sent.';
      }

      toast({
        title: 'Project created',
        description: temporaryPassword
          ? `${projectDescription} Temporary portal password: ${temporaryPassword}.${emailNote}`
          : `${projectDescription}${emailNote}`,
        variant: !payload.emailSent && !payload.emailSkipped ? 'destructive' : 'default',
      });
      const currentClientPath = getPortalAdminCurrentClientDetailPath(request.id);
      await syncCategoryCounts(payload.categoryCounts);
      router.push(currentClientPath);
      router.refresh();
    }).catch(() => {
      toast({
        variant: 'destructive',
        title: 'Could not create project',
        description: 'Please check your connection and try again.',
      });
    });
  }

  return (
    <form className="mt-6 space-y-4 border-t border-border pt-6" onSubmit={handleCreate}>
      <p className="text-sm font-medium text-foreground">Create a project for this request</p>
      <p className="text-sm text-muted-foreground">
        A portal account will be created automatically if the client does not have one yet. The client
        is always emailed when a project is created; new accounts also receive sign-in credentials in
        that email.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`project-title-${request.id}`}>Project Title</Label>
          <Input
            id={`project-title-${request.id}`}
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              if (fieldErrors.title) {
                setFieldErrors((current) => ({ ...current, title: undefined }));
              }
            }}
            maxLength={PROJECT_TITLE_MAX_LENGTH}
            required
            aria-invalid={fieldErrors.title ? true : undefined}
          />
          {fieldErrors.title ? (
            <p className="text-sm text-destructive">{fieldErrors.title}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor={`project-agreement-title-${request.id}`}>Agreement Title</Label>
          <Input
            id={`project-agreement-title-${request.id}`}
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
      </div>
      <div className="space-y-2">
        <Label htmlFor={`project-agreement-body-${request.id}`}>Agreement</Label>
        <Textarea
          id={`project-agreement-body-${request.id}`}
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
          <Label htmlFor={`project-completion-${request.id}`}>Estimated Completion</Label>
          <Input
            id={`project-completion-${request.id}`}
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
          <Label htmlFor={`project-deposit-${request.id}`}>Deposit Amount (USD)</Label>
          <Input
            id={`project-deposit-${request.id}`}
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            placeholder="0.00"
            value={depositAmount}
            required
            onChange={(event) => {
              setDepositAmount(event.target.value);
              if (fieldErrors.depositAmount) {
                setFieldErrors((current) => ({ ...current, depositAmount: undefined }));
              }
            }}
            aria-invalid={fieldErrors.depositAmount ? true : undefined}
          />
          {fieldErrors.depositAmount ? (
            <p className="text-sm text-destructive">{fieldErrors.depositAmount}</p>
          ) : null}
        </div>
      </div>
      <div className="w-full sm:w-1/2">
        <div className="space-y-2">
          <Label htmlFor={`project-amount-due-${request.id}`}>Amount Due (USD)</Label>
          <Input
            id={`project-amount-due-${request.id}`}
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            placeholder="0.00"
            value={amountDue}
            required
            onChange={(event) => {
              setAmountDue(event.target.value);
              if (fieldErrors.amountDue) {
                setFieldErrors((current) => ({ ...current, amountDue: undefined }));
              }
            }}
            aria-invalid={fieldErrors.amountDue ? true : undefined}
          />
          {fieldErrors.amountDue ? (
            <p className="text-sm text-destructive">{fieldErrors.amountDue}</p>
          ) : null}
        </div>
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating…' : 'Create Project'}
      </Button>
    </form>
  );
}

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PortalConsultationEditableFields } from '@/components/portal-consultation-editable-fields';
import {
  formatPortalAdminConsultationDate,
  getPortalAdminCurrentClientDetailPath,
} from '@/lib/portal-admin-client-display';
import type { PortalConsultationRequestDetail } from '@/lib/portal-consultation-requests-data';
import { createProjectFormSchema, PROJECT_DESIGN_MAX_LENGTH } from '@/lib/portal-admin-create-project-schema';
import { estimatedCompletionInputToIso } from '@/lib/portal-project-estimated-completion';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useSubmitGuard } from '@/hooks/use-submit-guard';
import { usePortalAdminCategoryCountsAfterMutation } from '@/hooks/use-portal-admin-category-counts-after-mutation';
import type { PortalAdminClientCategoryCounts } from '@/lib/portal-admin-nav';

type PortalAdminConsultationRequestsPanelProps = {
  requests: PortalConsultationRequestDetail[];
  defaultOpenRequestId?: string | null;
};

function requestAccordionValue(requestId: string): string {
  return `request-${requestId}`;
}

function defaultProjectTitle(request: PortalConsultationRequestDetail): string {
  const company = request.company?.trim();
  if (company) {
    return company;
  }

  const name = request.name.trim();
  return name ? `${name} project` : 'Client project';
}

type CreateProjectFieldErrors = Partial<
  Record<'title' | 'estimatedCompletionDate' | 'depositAmount' | 'amountDue' | 'design', string>
>;

function mapCreateProjectFormErrors(
  issues: { path: (string | number)[]; message: string }[]
): CreateProjectFieldErrors {
  const errors: CreateProjectFieldErrors = {};

  for (const issue of issues) {
    const field = issue.path[0];
    if (
      field === 'title' ||
      field === 'estimatedCompletionDate' ||
      field === 'depositAmount' ||
      field === 'amountDue' ||
      field === 'design'
    ) {
      if (!errors[field]) {
        errors[field] = issue.message;
      }
    }
  }

  return errors;
}

function CreateProjectForm({ request }: { request: PortalConsultationRequestDetail }) {
  const router = useRouter();
  const syncCategoryCounts = usePortalAdminCategoryCountsAfterMutation();
  const { toast } = useToast();
  const { isSubmitting, runGuardedSubmit } = useSubmitGuard();
  const [title, setTitle] = useState(defaultProjectTitle(request));
  const [estimatedCompletionDate, setEstimatedCompletionDate] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [amountDue, setAmountDue] = useState('');
  const [design, setDesign] = useState('');
  const [fieldErrors, setFieldErrors] = useState<CreateProjectFieldErrors>({});

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = createProjectFormSchema.safeParse({
      title,
      estimatedCompletionDate,
      depositAmount,
      amountDue,
      design,
    });

    if (!parsed.success) {
      setFieldErrors(mapCreateProjectFormErrors(parsed.error.issues));
      return;
    }

    setFieldErrors({});

    const estimatedCompletionAt = parsed.data.estimatedCompletionDate
      ? estimatedCompletionInputToIso(parsed.data.estimatedCompletionDate)
      : undefined;
    if (parsed.data.estimatedCompletionDate && !estimatedCompletionAt) {
      setFieldErrors({ estimatedCompletionDate: 'Enter a valid completion date' });
      return;
    }

    await runGuardedSubmit(async () => {
      const res = await fetch(
        `/api/portal/admin/consultations/${encodeURIComponent(request.id)}/project`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: parsed.data.title,
            estimatedCompletionAt,
            depositAmount: parsed.data.depositAmount,
            amountDue: parsed.data.amountDue,
            design: parsed.data.design,
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
          <Label htmlFor={`project-title-${request.id}`}>Project title</Label>
          <Input
            id={`project-title-${request.id}`}
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              if (fieldErrors.title) {
                setFieldErrors((current) => ({ ...current, title: undefined }));
              }
            }}
            maxLength={200}
            required
            aria-invalid={fieldErrors.title ? true : undefined}
          />
          {fieldErrors.title ? (
            <p className="text-sm text-destructive">{fieldErrors.title}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor={`project-completion-${request.id}`}>Estimated completion</Label>
          <Input
            id={`project-completion-${request.id}`}
            type="date"
            value={estimatedCompletionDate}
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
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`project-deposit-${request.id}`}>Deposit amount (USD)</Label>
          <Input
            id={`project-deposit-${request.id}`}
            type="number"
            inputMode="decimal"
            min={0}
            step="1.00"
            placeholder="0.00"
            value={depositAmount}
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
        <div className="space-y-2">
          <Label htmlFor={`project-amount-due-${request.id}`}>Amount due (USD)</Label>
          <Input
            id={`project-amount-due-${request.id}`}
            type="number"
            inputMode="decimal"
            min={0}
            step="1.00"
            placeholder="0.00"
            value={amountDue}
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
      <div className="space-y-2">
        <Label htmlFor={`project-design-${request.id}`}>Project design</Label>
        <Textarea
          id={`project-design-${request.id}`}
          value={design}
          onChange={(event) => {
            setDesign(event.target.value);
            if (fieldErrors.design) {
              setFieldErrors((current) => ({ ...current, design: undefined }));
            }
          }}
          maxLength={PROJECT_DESIGN_MAX_LENGTH}
          required
          rows={6}
          placeholder="Describe the client's needs and purpose of the project…"
          className="min-h-[8rem] resize-y"
          aria-invalid={fieldErrors.design ? true : undefined}
        />
        <p
          className={cn(
            'text-right text-xs tabular-nums',
            design.length >= PROJECT_DESIGN_MAX_LENGTH ? 'text-destructive' : 'text-muted-foreground'
          )}
          aria-live="polite"
        >
          {design.length} / {PROJECT_DESIGN_MAX_LENGTH}
        </p>
        {fieldErrors.design ? (
          <p className="text-sm text-destructive">{fieldErrors.design}</p>
        ) : null}
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating…' : 'Create project'}
      </Button>
    </form>
  );
}

export function PortalAdminConsultationRequestsPanel({
  requests,
  defaultOpenRequestId,
}: PortalAdminConsultationRequestsPanelProps) {
  const openRequests = requests.filter((request) => !request.projectId);
  const preferredId = defaultOpenRequestId ?? openRequests[0]?.id;
  const initialOpen = preferredId ? [requestAccordionValue(preferredId)] : [];

  const [openValues, setOpenValues] = useState<string[]>(initialOpen);

  if (openRequests.length === 0) {
    return <p className="text-sm text-muted-foreground">No consultation requests to display.</p>;
  }

  return (
    <Accordion type="multiple" value={openValues} onValueChange={setOpenValues} className="max-w-3xl">
      {openRequests.map((request) => {
        const value = requestAccordionValue(request.id);
        const summaryParts = [request.name.trim(), request.company?.trim()].filter(Boolean);
        const summary = summaryParts.join(' · ') || 'Consultation request';
        const submittedLabel = formatPortalAdminConsultationDate(request.createdAt);

        return (
          <AccordionItem key={request.id} value={value}>
            <AccordionTrigger value={value}>
              <span className="flex min-w-0 flex-col items-start gap-0.5 text-left">
                <span className="font-medium">{summary}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  Submitted {submittedLabel}
                  {' · No project yet'}
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent value={value}>
              <PortalConsultationEditableFields
                consultationRequestId={request.id}
                hidePortalAccount
                info={{
                  name: request.name,
                  email: request.email,
                  company: request.company,
                  phone: request.phone,
                  preferredContact: request.preferredContact,
                  timezone: request.timezone,
                  message: request.message,
                  submittedAt: request.createdAt,
                  hasPortalAccount: false,
                }}
              />
              <CreateProjectForm request={request} />
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}

'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { consultationFormSchema, type ConsultationFormValues } from '@/lib/consultation-schema';
import {
  CONSULTATION_COMPANY_MAX_LENGTH,
  CONSULTATION_EMAIL_MAX_LENGTH,
  CONSULTATION_MESSAGE_MAX_LENGTH,
  CONSULTATION_NAME_MAX_LENGTH,
  CONSULTATION_PHONE_MAX_LENGTH,
} from '@/lib/field-lengths';
import type { PortalAdminClientCategoryCounts } from '@/lib/portal-admin-nav';
import { formatPhoneNumber, isCompletePhoneNumber } from '@/lib/phone';
import { getTimezoneOptions } from '@/lib/timezones';
import { cn } from '@/lib/utils';
import { usePortalAdminCategoryCountsAfterMutation } from '@/hooks/use-portal-admin-category-counts-after-mutation';
import { useSubmitGuard } from '@/hooks/use-submit-guard';
import { useToast } from '@/hooks/use-toast';

type ManualConsultationFieldErrors = Partial<Record<keyof ConsultationFormValues, string>>;

const INITIAL_VALUES: ConsultationFormValues = {
  name: '',
  email: '',
  phone: '',
  timezone: '',
  preferredContact: 'e',
  company: '',
  message: '',
};

function mapFieldErrors(
  issues: { path: (string | number)[]; message: string }[]
): ManualConsultationFieldErrors {
  const errors: ManualConsultationFieldErrors = {};

  for (const issue of issues) {
    const field = issue.path[0];
    if (typeof field === 'string' && field in INITIAL_VALUES) {
      const key = field as keyof ConsultationFormValues;
      if (!errors[key]) {
        errors[key] = issue.message;
      }
    }
  }

  return errors;
}

export function PortalAdminManualConsultationForm() {
  const router = useRouter();
  const syncCategoryCounts = usePortalAdminCategoryCountsAfterMutation();
  const { toast } = useToast();
  const { isSubmitting, runGuardedSubmit } = useSubmitGuard();
  const timezoneOptions = useMemo(() => getTimezoneOptions(), []);
  const [values, setValues] = useState<ConsultationFormValues>(INITIAL_VALUES);
  const [fieldErrors, setFieldErrors] = useState<ManualConsultationFieldErrors>({});

  const hasPhone = isCompletePhoneNumber(values.phone);
  const messageLength = values.message.length;
  const messageAtLimit = messageLength >= CONSULTATION_MESSAGE_MAX_LENGTH;

  function setField<K extends keyof ConsultationFormValues>(
    field: K,
    value: ConsultationFormValues[K]
  ) {
    setValues((current) => ({
      ...current,
      [field]: value,
      ...(field === 'phone' && !isCompletePhoneNumber(String(value)) ? { timezone: '' } : {}),
    }));
    if (fieldErrors[field]) {
      setFieldErrors((current) => ({ ...current, [field]: undefined }));
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = consultationFormSchema.safeParse(values);
    if (!parsed.success) {
      setFieldErrors(mapFieldErrors(parsed.error.issues));
      return;
    }

    setFieldErrors({});

    await runGuardedSubmit(async () => {
      const res = await fetch('/api/portal/admin/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });

      const payload = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        categoryCounts?: PortalAdminClientCategoryCounts;
      };

      if (!res.ok || !payload.ok) {
        toast({
          variant: 'destructive',
          title: 'Could not add consultation',
          description: payload.error ?? 'Please try again.',
        });
        return;
      }

      toast({
        title: 'Consultation added',
        description: `${parsed.data.name} is now listed under consultations.`,
      });
      setValues(INITIAL_VALUES);
      await syncCategoryCounts(payload.categoryCounts);
      router.refresh();
    }).catch(() => {
      toast({
        variant: 'destructive',
        title: 'Could not add consultation',
        description: 'Please check your connection and try again.',
      });
    });
  }

  return (
    <form
      className="mb-10 rounded-lg border border-border bg-card/70 p-5"
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Add Consultation</h2>
          <p className="text-sm text-muted-foreground">Create a request for a client you spoke with directly.</p>
        </div>
        <Button type="submit" disabled={isSubmitting} className="sm:self-start">
          <Plus className="size-4" aria-hidden />
          {isSubmitting ? 'Adding...' : 'Add Consultation'}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="manual-consultation-name">Full Name</Label>
          <Input
            id="manual-consultation-name"
            value={values.name}
            onChange={(event) => setField('name', event.target.value)}
            maxLength={CONSULTATION_NAME_MAX_LENGTH}
            required
            aria-invalid={fieldErrors.name ? true : undefined}
          />
          {fieldErrors.name ? <p className="text-sm text-destructive">{fieldErrors.name}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="manual-consultation-email">Email</Label>
          <Input
            id="manual-consultation-email"
            type="email"
            value={values.email}
            onChange={(event) => setField('email', event.target.value)}
            maxLength={CONSULTATION_EMAIL_MAX_LENGTH}
            required
            aria-invalid={fieldErrors.email ? true : undefined}
          />
          {fieldErrors.email ? <p className="text-sm text-destructive">{fieldErrors.email}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="manual-consultation-phone">Phone</Label>
          <Input
            id="manual-consultation-phone"
            type="tel"
            inputMode="numeric"
            value={values.phone}
            onChange={(event) => setField('phone', formatPhoneNumber(event.target.value))}
            maxLength={CONSULTATION_PHONE_MAX_LENGTH}
            aria-invalid={fieldErrors.phone ? true : undefined}
          />
          {fieldErrors.phone ? <p className="text-sm text-destructive">{fieldErrors.phone}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="manual-consultation-company">Company</Label>
          <Input
            id="manual-consultation-company"
            value={values.company}
            onChange={(event) => setField('company', event.target.value)}
            maxLength={CONSULTATION_COMPANY_MAX_LENGTH}
            aria-invalid={fieldErrors.company ? true : undefined}
          />
          {fieldErrors.company ? (
            <p className="text-sm text-destructive">{fieldErrors.company}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto]">
        {hasPhone ? (
          <div className="space-y-2">
            <Label htmlFor="manual-consultation-timezone">Timezone</Label>
            <Select
              value={values.timezone || undefined}
              onValueChange={(value) => setField('timezone', value)}
            >
              <SelectTrigger id="manual-consultation-timezone">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {timezoneOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldErrors.timezone ? (
              <p className="text-sm text-destructive">{fieldErrors.timezone}</p>
            ) : null}
          </div>
        ) : (
          <div className="hidden sm:block" />
        )}

        <div className="space-y-2">
          <Label>Preferred Contact</Label>
          <RadioGroup
            value={values.preferredContact}
            onValueChange={(value) => setField('preferredContact', value === 'p' ? 'p' : 'e')}
            className="flex min-h-10 items-center gap-5"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="e" id="manual-consultation-prefer-email" />
              <Label htmlFor="manual-consultation-prefer-email" className="font-normal">
                Email
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="p" id="manual-consultation-prefer-phone" />
              <Label htmlFor="manual-consultation-prefer-phone" className="font-normal">
                Phone
              </Label>
            </div>
          </RadioGroup>
          {fieldErrors.preferredContact ? (
            <p className="text-sm text-destructive">{fieldErrors.preferredContact}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <Label htmlFor="manual-consultation-message">Message</Label>
        <Textarea
          id="manual-consultation-message"
          value={values.message}
          onChange={(event) => setField('message', event.target.value)}
          maxLength={CONSULTATION_MESSAGE_MAX_LENGTH}
          required
          rows={5}
          className="min-h-[8rem] resize-y"
          aria-invalid={fieldErrors.message ? true : undefined}
        />
        <p
          className={cn(
            'text-right text-xs tabular-nums',
            messageAtLimit ? 'text-destructive' : 'text-muted-foreground'
          )}
          aria-live="polite"
        >
          {messageLength} / {CONSULTATION_MESSAGE_MAX_LENGTH}
        </p>
        {fieldErrors.message ? (
          <p className="text-sm text-destructive">{fieldErrors.message}</p>
        ) : null}
      </div>
    </form>
  );
}

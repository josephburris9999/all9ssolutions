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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CONSULTATION_PHONE_MAX_LENGTH } from '@/lib/field-lengths';
import { formatPortalAdminPreferredContact } from '@/lib/portal-admin-client-display';
import { portalAdminPreferredContactSchema } from '@/lib/portal-admin-preferred-contact-schema';
import { formatPhoneNumber } from '@/lib/phone';
import { getTimezoneOptions, type TimezoneOption } from '@/lib/timezones';
import { useToast } from '@/hooks/use-toast';
import { useSubmitGuard } from '@/hooks/use-submit-guard';

type PortalClientContactFieldsProviderProps = {
  consultationRequestId: string;
  initialPreferredContact: 'e' | 'p';
  initialPhone: string | null;
  initialTimezone: string | null;
  children: React.ReactNode;
};

type ContactFieldKind = 'preferred' | 'phone' | 'timezone';

type FieldErrors = {
  phone?: string;
  timezone?: string;
};

type ContactFieldsContextValue = {
  openModal: (source: ContactFieldKind) => void;
  savedPreferredContact: 'e' | 'p';
  savedPhone: string;
  savedTimezone: string;
  timezoneOptions: TimezoneOption[];
};

const ContactFieldsContext = React.createContext<ContactFieldsContextValue | null>(null);

function useContactFieldsContext(): ContactFieldsContextValue {
  const context = React.useContext(ContactFieldsContext);
  if (!context) {
    throw new Error('PortalClientContactField must be used within PortalClientContactFieldsProvider');
  }

  return context;
}

function normalizePhone(value: string | null): string {
  return formatPhoneNumber(value ?? '');
}

function normalizeTimezone(value: string | null): string {
  return value?.trim() ?? '';
}

function formatPhoneDisplay(phone: string): string {
  if (!phone) {
    return '—';
  }

  const formatted = formatPhoneNumber(phone);
  return formatted.length > 0 ? formatted : phone;
}

function formatTimezoneDisplay(timezone: string, timezoneOptions: TimezoneOption[]): string {
  if (!timezone) {
    return '—';
  }

  return timezoneOptions.find((option) => option.value === timezone)?.label ?? timezone;
}

export function PortalClientContactFieldsProvider({
  consultationRequestId,
  initialPreferredContact,
  initialPhone,
  initialTimezone,
  children,
}: PortalClientContactFieldsProviderProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { isSubmitting: isSaving, runGuardedSubmit } = useSubmitGuard();
  const timezoneOptions = React.useMemo(() => getTimezoneOptions(), []);
  const phoneInputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [modalSource, setModalSource] = React.useState<ContactFieldKind>('preferred');
  const [savedValue, setSavedValue] = React.useState(initialPreferredContact);
  const [savedPhone, setSavedPhone] = React.useState(() => normalizePhone(initialPhone));
  const [savedTimezone, setSavedTimezone] = React.useState(() => normalizeTimezone(initialTimezone));
  const [draftValue, setDraftValue] = React.useState(initialPreferredContact);
  const [draftPhone, setDraftPhone] = React.useState(() => normalizePhone(initialPhone));
  const [draftTimezone, setDraftTimezone] = React.useState(() => normalizeTimezone(initialTimezone));
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});

  React.useEffect(() => {
    setSavedValue(initialPreferredContact);
    setSavedPhone(normalizePhone(initialPhone));
    setSavedTimezone(normalizeTimezone(initialTimezone));
  }, [initialPreferredContact, initialPhone, initialTimezone]);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    setDraftValue(savedValue);
    setDraftPhone(savedPhone);
    setDraftTimezone(savedTimezone);
    setFieldErrors({});

    if (modalSource === 'phone' || modalSource === 'timezone') {
      setDraftValue('p');
    }
  }, [open, modalSource, savedValue, savedPhone, savedTimezone]);

  React.useEffect(() => {
    if (!open || modalSource !== 'phone') {
      return;
    }

    const animationFrameId = window.requestAnimationFrame(() => {
      phoneInputRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [open, modalSource]);

  function resetDrafts() {
    setDraftValue(savedValue);
    setDraftPhone(savedPhone);
    setDraftTimezone(savedTimezone);
    setFieldErrors({});
  }

  function openModal(source: ContactFieldKind) {
    setModalSource(source);
    setOpen(true);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      resetDrafts();
      setModalSource('preferred');
    }

    setOpen(nextOpen);
  }

  function handleCancel() {
    resetDrafts();
    setModalSource('preferred');
    setOpen(false);
  }

  function isUpdatingPhoneTimezone(): boolean {
    return draftValue === 'p' || draftPhone !== savedPhone || draftTimezone !== savedTimezone;
  }

  function hasChanges(): boolean {
    return draftValue !== savedValue || draftPhone !== savedPhone || draftTimezone !== savedTimezone;
  }

  function validateDraft(): FieldErrors {
    const payload = isUpdatingPhoneTimezone()
      ? {
          preferredContact: 'p' as const,
          phone: draftPhone,
          timezone: draftTimezone,
        }
      : {
          preferredContact: draftValue,
        };

    const parsed = portalAdminPreferredContactSchema.safeParse(payload);

    if (parsed.success) {
      return {};
    }

    const errors: FieldErrors = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (field === 'phone' && !errors.phone) {
        errors.phone = issue.message;
      }
      if (field === 'timezone' && !errors.timezone) {
        errors.timezone = issue.message;
      }
    }

    return errors;
  }

  async function handleSave() {
    if (!hasChanges()) {
      setOpen(false);
      return;
    }

    const errors = validateDraft();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    await runGuardedSubmit(async () => {
      const payload = isUpdatingPhoneTimezone()
        ? {
            preferredContact: 'p' as const,
            phone: draftPhone,
            timezone: draftTimezone,
          }
        : {
            preferredContact: draftValue,
          };

      const response = await fetch(
        `/api/portal/admin/consultations/${encodeURIComponent(consultationRequestId)}/preferred-contact`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      let responsePayload: {
        ok?: boolean;
        error?: string;
        preferredContact?: 'e' | 'p';
        phone?: string | null;
        timezone?: string | null;
      } = {};
      try {
        responsePayload = (await response.json()) as typeof responsePayload;
      } catch {
        // non-JSON response
      }

      if (!response.ok || !responsePayload.ok || !responsePayload.preferredContact) {
        toast({
          variant: 'destructive',
          title: 'Could not update contact details',
          description:
            typeof responsePayload.error === 'string' && responsePayload.error.length > 0
              ? responsePayload.error
              : 'Please try again.',
        });
        return;
      }

      setSavedValue(responsePayload.preferredContact);
      setSavedPhone(normalizePhone(responsePayload.phone));
      setSavedTimezone(normalizeTimezone(responsePayload.timezone));
      setOpen(false);
      setModalSource('preferred');
      router.refresh();
      toast({
        title: 'Contact details updated',
        description: 'Preferred contact, phone, and timezone were saved.',
      });
    });
  }

  const showPhoneTimezoneFields =
    draftValue === 'p' || modalSource === 'phone' || modalSource === 'timezone';

  const contextValue = React.useMemo<ContactFieldsContextValue>(
    () => ({
      openModal,
      savedPreferredContact: savedValue,
      savedPhone,
      savedTimezone,
      timezoneOptions,
    }),
    [savedValue, savedPhone, savedTimezone, timezoneOptions]
  );

  return (
    <ContactFieldsContext.Provider value={contextValue}>
      {children}

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit contact details</DialogTitle>
            <DialogDescription>
              Update preferred contact, phone, and timezone. Phone and timezone are both required when
              either is changed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <RadioGroup
              value={draftValue}
              onValueChange={(value) => {
                const nextValue = value === 'p' ? 'p' : 'e';
                setDraftValue(nextValue);
                setFieldErrors({});
              }}
              className="gap-3"
            >
              <div className="flex items-center gap-3">
                <RadioGroupItem value="e" id="preferred-contact-email" />
                <Label htmlFor="preferred-contact-email" className="font-normal">
                  Email
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <RadioGroupItem value="p" id="preferred-contact-phone" />
                <Label htmlFor="preferred-contact-phone" className="font-normal">
                  Phone
                </Label>
              </div>
            </RadioGroup>

            {showPhoneTimezoneFields ? (
              <div className="space-y-4 border-t border-border pt-4">
                <div className="space-y-2">
                  <Label htmlFor="preferred-contact-phone-input">Phone</Label>
                  <Input
                    ref={phoneInputRef}
                    id="preferred-contact-phone-input"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    maxLength={CONSULTATION_PHONE_MAX_LENGTH}
                    value={draftPhone}
                    onChange={(event) => {
                      setDraftPhone(formatPhoneNumber(event.target.value));
                      if (fieldErrors.phone) {
                        setFieldErrors((current) => ({ ...current, phone: undefined }));
                      }
                    }}
                    aria-invalid={fieldErrors.phone ? true : undefined}
                  />
                  {fieldErrors.phone ? (
                    <p className="text-sm text-destructive">{fieldErrors.phone}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preferred-contact-timezone">Timezone</Label>
                  <Select
                    value={draftTimezone || undefined}
                    onValueChange={(value) => {
                      setDraftTimezone(value);
                      if (fieldErrors.timezone) {
                        setFieldErrors((current) => ({ ...current, timezone: undefined }));
                      }
                    }}
                  >
                    <SelectTrigger id="preferred-contact-timezone" aria-invalid={fieldErrors.timezone ? true : undefined}>
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
              </div>
            ) : null}
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
    </ContactFieldsContext.Provider>
  );
}

type PortalClientContactFieldProps = {
  kind: ContactFieldKind;
};

export function PortalClientContactField({ kind }: PortalClientContactFieldProps) {
  const { openModal, savedPreferredContact, savedPhone, savedTimezone, timezoneOptions } =
    useContactFieldsContext();

  const labels: Record<ContactFieldKind, { label: string; editLabel: string; value: React.ReactNode }> = {
    preferred: {
      label: 'Preferred',
      editLabel: 'Edit preferred contact',
      value: formatPortalAdminPreferredContact(savedPreferredContact),
    },
    phone: {
      label: 'Phone',
      editLabel: 'Edit phone',
      value: formatPhoneDisplay(savedPhone),
    },
    timezone: {
      label: 'Timezone',
      editLabel: 'Edit timezone',
      value: formatTimezoneDisplay(savedTimezone, timezoneOptions),
    },
  };

  const field = labels[kind];

  return (
    <div className="space-y-1">
      <dt className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <span>{field.label}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
          aria-label={field.editLabel}
          onClick={() => openModal(kind)}
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden />
        </Button>
      </dt>
      <dd className="text-base text-foreground">{field.value}</dd>
    </div>
  );
}

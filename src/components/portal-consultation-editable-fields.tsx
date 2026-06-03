'use client';

import type { ReactNode } from 'react';
import {
  formatPortalAdminConsultationDate,
  formatPortalAdminPreferredContact,
} from '@/lib/portal-admin-client-display';
import {
  PortalClientContactField,
  PortalClientContactFieldsProvider,
} from '@/components/portal-client-contact-fields-editor';
import { PortalClientCompanyField } from '@/components/portal-client-company-field';
import { PortalClientNameField } from '@/components/portal-client-name-field';
import { PortalClientChangePasswordField } from '@/components/portal-client-change-password-field';
import { PortalClientPortalCredentialsResetField } from '@/components/portal-client-portal-credentials-reset-field';
import { formatPhoneNumber } from '@/lib/phone';
import { cn } from '@/lib/utils';

export type PortalConsultationEditableFieldsInfo = {
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  preferredContact: 'e' | 'p';
  timezone: string | null;
  message: string;
  submittedAt: string;
  hasPortalAccount: boolean;
  mustChangePassword?: boolean;
};

export type PortalConsultationEditableFieldsProps = {
  info: PortalConsultationEditableFieldsInfo;
  consultationRequestId?: string;
  allowCreatePortalAccount?: boolean;
  /** When true, admin credential controls (e.g. must-change-password) are omitted. */
  hidePortalCredentials?: boolean;
  /** When true, the request message field is omitted (shown elsewhere). */
  hideRequestMessage?: boolean;
  /** Client portal: always show reset-password control inside client information. */
  showClientPasswordReset?: boolean;
  /** When false, name and company are read-only even if consultationRequestId is set. */
  allowEditNameAndCompany?: boolean;
  className?: string;
};

const FLOW_FIELD_CLASS = 'min-w-0 flex-[1_1_11rem] space-y-1';
const FLOW_FIELD_FULL_CLASS = 'min-w-full basis-full space-y-1';

function HeroField({
  label,
  children,
  fullWidth = false,
  truncate = false,
}: {
  label: string;
  children: ReactNode;
  fullWidth?: boolean;
  truncate?: boolean;
}) {
  return (
    <div className={cn(fullWidth ? FLOW_FIELD_FULL_CLASS : FLOW_FIELD_CLASS)}>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className={cn('text-base text-foreground', truncate && 'min-w-0')}>{children}</dd>
    </div>
  );
}

function formatPhoneDisplay(phone: string | null): string {
  if (!phone) {
    return '—';
  }

  const formatted = formatPhoneNumber(phone);
  return formatted.length > 0 ? formatted : phone;
}

function ConsultationEditableFields({
  info,
  consultationRequestId,
  allowCreatePortalAccount = false,
  hidePortalCredentials = false,
  hideRequestMessage = false,
  showClientPasswordReset = false,
  allowEditNameAndCompany = true,
  className,
}: PortalConsultationEditableFieldsProps) {
  const preferredField = consultationRequestId ? (
    <PortalClientContactField kind="preferred" />
  ) : (
    <HeroField label="Preferred">{formatPortalAdminPreferredContact(info.preferredContact)}</HeroField>
  );

  const phoneField = consultationRequestId ? (
    <PortalClientContactField kind="phone" />
  ) : (
    <HeroField label="Phone">{formatPhoneDisplay(info.phone)}</HeroField>
  );

  const timezoneField = consultationRequestId ? (
    <PortalClientContactField kind="timezone" />
  ) : (
    <HeroField label="Timezone">{info.timezone ?? '—'}</HeroField>
  );

  const nameField =
    consultationRequestId && allowEditNameAndCompany ? (
      <PortalClientNameField consultationRequestId={consultationRequestId} initialName={info.name} />
    ) : (
      <HeroField label="Name">{info.name.trim() || '—'}</HeroField>
    );

  const companyField =
    consultationRequestId && allowEditNameAndCompany ? (
      <PortalClientCompanyField consultationRequestId={consultationRequestId} initialCompany={info.company} />
    ) : (
      <HeroField label="Company">{info.company ?? '—'}</HeroField>
    );

  let portalCredentialsField: ReactNode = null;
  if (!hidePortalCredentials && info.hasPortalAccount) {
    if (allowCreatePortalAccount && consultationRequestId) {
      portalCredentialsField = (
        <PortalClientPortalCredentialsResetField consultationRequestId={consultationRequestId} />
      );
    } else {
      portalCredentialsField = (
        <HeroField label="Must change password">{info.mustChangePassword ? 'Yes' : 'No'}</HeroField>
      );
    }
  }

  return (
    <dl className={cn('flex flex-wrap gap-x-6 gap-y-4', className)}>
      <div className={FLOW_FIELD_CLASS}>{nameField}</div>
      <div className={FLOW_FIELD_CLASS}>{companyField}</div>
      <div className={FLOW_FIELD_CLASS}>{preferredField}</div>
      <HeroField label="Email" truncate>
        <a
          href={`mailto:${encodeURIComponent(info.email)}`}
          className="block min-w-0 truncate text-foreground transition-colors hover:text-primary"
          title={info.email}
        >
          {info.email}
        </a>
      </HeroField>
      <div className={FLOW_FIELD_CLASS}>{phoneField}</div>
      <div className={FLOW_FIELD_CLASS}>{timezoneField}</div>
      {showClientPasswordReset ? (
        <div className="flex min-w-full basis-full flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <div className="min-w-0 space-y-1">
            <span className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Submitted
            </span>
            <time dateTime={info.submittedAt} className="block text-base text-foreground">
              {formatPortalAdminConsultationDate(info.submittedAt)}
            </time>
          </div>
          <div className="flex shrink-0 items-end self-end">
            <PortalClientChangePasswordField mustChangePassword={info.mustChangePassword ?? false} />
          </div>
        </div>
      ) : (
        <HeroField label="Submitted">
          <time dateTime={info.submittedAt}>{formatPortalAdminConsultationDate(info.submittedAt)}</time>
        </HeroField>
      )}
      {portalCredentialsField ? <div className={FLOW_FIELD_CLASS}>{portalCredentialsField}</div> : null}
      {!hideRequestMessage ? (
        <HeroField label="Request" fullWidth>
          <span className="whitespace-pre-wrap leading-relaxed">{info.message}</span>
        </HeroField>
      ) : null}
    </dl>
  );
}

export function PortalConsultationEditableFields(props: PortalConsultationEditableFieldsProps) {
  const { info, consultationRequestId } = props;

  if (!consultationRequestId) {
    return <ConsultationEditableFields {...props} />;
  }

  return (
    <PortalClientContactFieldsProvider
      consultationRequestId={consultationRequestId}
      initialPreferredContact={info.preferredContact}
      initialPhone={info.phone}
      initialTimezone={info.timezone}
    >
      <ConsultationEditableFields {...props} />
    </PortalClientContactFieldsProvider>
  );
}

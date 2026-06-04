import type { ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  formatPortalAdminConsultationDate,
  formatPortalAdminPreferredContact,
  type PortalAdminConsultationDetail,
} from '@/lib/portal-admin-consultations';
import { formatPhoneNumber } from '@/lib/phone';

type PortalAdminConsultationDetailSectionProps = {
  consultation: PortalAdminConsultationDetail;
  backHref?: string;
  backLabel?: string;
};

function DetailField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
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

export function PortalAdminConsultationDetailSection({
  consultation,
  backHref = '/portal/admin/clients/consultations',
  backLabel = 'Back to Consultations',
}: PortalAdminConsultationDetailSectionProps) {
  return (
    <section className="mt-12" aria-labelledby="portal-admin-consultation-detail-heading">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="portal-admin-consultation-detail-heading" className="text-2xl font-bold text-foreground">
            Client details
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{consultation.name}</p>
        </div>
        <Button asChild variant="outline" size="sm" className="w-fit">
          <Link href={backHref}>{backLabel}</Link>
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <dl className="grid gap-6 sm:grid-cols-2">
          <DetailField label="Name">{consultation.name}</DetailField>
          <DetailField label="Email">
            <a
              href={`mailto:${encodeURIComponent(consultation.email)}`}
              className="text-primary transition-colors hover:underline"
            >
              {consultation.email}
            </a>
          </DetailField>
          <DetailField label="Company">{consultation.company ?? '—'}</DetailField>
          <DetailField label="Phone">{formatPhoneDisplay(consultation.phone)}</DetailField>
          <DetailField label="Preferred contact">
            {formatPortalAdminPreferredContact(consultation.preferredContact)}
          </DetailField>
          <DetailField label="Timezone">{consultation.timezone ?? '—'}</DetailField>
          <DetailField label="Submitted">
            <time dateTime={consultation.createdAt}>
              {formatPortalAdminConsultationDate(consultation.createdAt)}
            </time>
          </DetailField>
          <DetailField label="Last updated">
            <time dateTime={consultation.updatedAt}>
              {formatPortalAdminConsultationDate(consultation.updatedAt)}
            </time>
          </DetailField>
        </dl>

        <div className="mt-6 space-y-1 border-t border-border pt-6">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Message</dt>
          <dd className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{consultation.message}</dd>
        </div>
      </div>
    </section>
  );
}

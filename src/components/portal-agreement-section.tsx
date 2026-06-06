'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PortalAdminAddProjectAgreementDialog } from '@/components/portal-admin-add-project-agreement-dialog';
import { PortalAgreementBody } from '@/components/portal-agreement-body';
import {
  buildPortalAgreementSignatureRenderContext,
  PortalAgreementSignatureBlock,
  portalAgreementSignatureHeadingForKind,
} from '@/components/portal-agreement-signature-block';
import {
  formatPortalSignedAt,
  getBrowserTimeZone,
  getPortalAgreementContentSections,
  type PortalAgreementStatus,
} from '@/lib/portal-agreement';
import type { PortalAgreementListItem } from '@/lib/portal-agreement-data';
import { agreementPdfDownloadFilename } from '@/lib/portal-agreement-filename';
import { getPortalAgreementPdfPath, getPortalAgreementSignPath } from '@/lib/portal-agreement-paths';
import type { PortalClientProfile } from '@/lib/portal-user';
import { useToast } from '@/hooks/use-toast';
import { useSubmitGuard } from '@/hooks/use-submit-guard';

type PortalAgreementSectionProps = {
  clientName: string;
  clientProfile: PortalClientProfile;
  clientTimezone: string | null;
  agreements: PortalAgreementListItem[];
  showSignedAgreementNotice?: boolean;
  readOnly?: boolean;
  consultationRequestId?: string;
  /** When true, all agreement accordions start collapsed (admin views). */
  initialAccordionCollapsed?: boolean;
  /** Admin portal: show Add Agreement below the agreements accordion. */
  showAddAgreementButton?: boolean;
  /** Required when `showAddAgreementButton` is true. */
  projectId?: string | null;
};

function formatAgreementClientParty(profile: PortalClientProfile): string {
  const name = profile.name.trim();
  const company = profile.company?.trim() ?? '';

  if (name && company) {
    return `${name}, ${company}`;
  }

  if (name) {
    return name;
  }

  if (company) {
    return company;
  }

  return 'Client';
}

function agreementAccordionValue(agreementId: string): string {
  return `agreement-${agreementId}`;
}

type PortalAgreementCardProps = {
  item: PortalAgreementListItem;
  clientProfile: PortalClientProfile;
  displayTimeZone: string;
  readOnly: boolean;
  consultationRequestId?: string;
  showSignedAgreementNotice: boolean;
  onSigned: (agreementId: string, status: PortalAgreementStatus) => void;
};

function PortalAgreementCard({
  item,
  clientProfile,
  displayTimeZone,
  readOnly,
  consultationRequestId,
  showSignedAgreementNotice,
  onSigned,
}: PortalAgreementCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [status, setStatus] = useState(item.status);
  const [accepted, setAccepted] = useState(false);
  const { isSubmitting, runGuardedSubmit } = useSubmitGuard();
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    setStatus(item.status);
  }, [item.status]);

  const signedLabel =
    status.signed && status.signedAt ? formatPortalSignedAt(status.signedAt, displayTimeZone) : null;

  const clientServiceSections = useMemo(() => {
    if (item.kind !== 'client') {
      return null;
    }

    return getPortalAgreementContentSections();
  }, [item.kind]);

  const signatureContext = useMemo(
    () =>
      buildPortalAgreementSignatureRenderContext({
        clientProfile,
        timeZone: displayTimeZone,
        clientAccepted: accepted && !status.signed,
        signed: status.signed,
        signerName: status.signerName,
        signedAt: status.signedAt,
        signedAtLabel: signedLabel,
      }),
    [accepted, clientProfile, displayTimeZone, signedLabel, status]
  );

  const hasAgreementBody =
    item.kind === 'client' ||
    Boolean(item.body?.trim());

  const clientSignerName = clientProfile.name.trim();
  const accordionValue = agreementAccordionValue(item.id);
  const displayTitle =
    item.projectTitle && item.kind === 'project'
      ? `${item.title} (${item.projectTitle})`
      : item.title;

  async function handleSign(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await runGuardedSubmit(async () => {
      const signedAt = new Date().toISOString();
      const signTimeZone = displayTimeZone;

      const res = await fetch(getPortalAgreementSignPath(item.id), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signerName: clientSignerName,
          accepted,
          signedAt,
          clientTimeZone: signTimeZone,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        agreement?: PortalAgreementStatus;
      };

      if (!res.ok || !data.ok || !data.agreement) {
        toast({
          variant: 'destructive',
          title: 'Unable to sign agreement',
          description: data.error ?? 'Please try again.',
        });
        return;
      }

      setStatus(data.agreement);
      onSigned(item.id, data.agreement);
      setAccepted(false);
      toast({
        title: 'Agreement signed',
        description: 'Your electronic signature has been recorded.',
      });
      router.refresh();
    }).catch(() => {
      toast({
        variant: 'destructive',
        title: 'Unable to sign agreement',
        description: 'Please check your connection and try again.',
      });
    });
  }

  async function handleDownloadPdf(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();

    setIsDownloading(true);
    try {
      const pdfUrl = getPortalAgreementPdfPath(item.id, consultationRequestId);

      const res = await fetch(pdfUrl);
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? 'Download failed');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = agreementPdfDownloadFilename(item.title);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Unable to download PDF',
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <AccordionItem value={accordionValue}>
      <AccordionTrigger
        value={accordionValue}
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            disabled={isDownloading}
            onClick={handleDownloadPdf}
          >
            <Download className="h-4 w-4" />
            {isDownloading ? 'Downloading…' : 'Download PDF'}
          </Button>
        }
      >
        {displayTitle}
      </AccordionTrigger>
      <AccordionContent value={accordionValue}>
        {showSignedAgreementNotice && status.signed && status.signerName ? (
          <p className="mb-4 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground">
            Signed by <span className="font-medium">{status.signerName}</span>
            {signedLabel ? <> on {signedLabel}</> : null}. This agreement cannot be signed again.
          </p>
        ) : null}

        <div className="max-h-80 space-y-4 overflow-y-auto rounded-md border border-border bg-muted/20 p-4 text-sm leading-relaxed text-muted-foreground">
          {item.kind === 'client' && clientServiceSections
            ? clientServiceSections.map((section) => (
                <div key={section.heading}>
                  <h3 className="mb-1 font-semibold text-foreground">{section.heading}</h3>
                  <PortalAgreementBody section={section} />
                </div>
              ))
            : null}
          {item.kind === 'project' ? (
            item.body?.trim() ? (
              <p className="whitespace-pre-wrap text-foreground">{item.body.trim()}</p>
            ) : (
              <p className="text-muted-foreground">
                Agreement text is not available yet. Contact all9s Solutions if you need a copy.
              </p>
            )
          ) : null}
          <PortalAgreementSignatureBlock
            clientProfile={clientProfile}
            timeZone={displayTimeZone}
            clientAccepted={signatureContext.clientAccepted}
            signature={signatureContext.signature}
            heading={portalAgreementSignatureHeadingForKind(item.kind)}
            separated={hasAgreementBody}
          />
        </div>

        {status.signed ? (
          <p className="mt-4 text-sm text-muted-foreground">
            This agreement is on file. Use{' '}
            <span className="font-medium text-foreground">Download PDF</span> above for a copy.
          </p>
        ) : readOnly ? (
          <p className="mt-4 text-sm text-muted-foreground">
            This client has not signed this agreement yet.
          </p>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleSign}>
            <div className="flex items-start gap-3">
              <input
                id={`agreement-accepted-${item.id}`}
                type="checkbox"
                checked={accepted}
                onChange={(event) => setAccepted(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <Label
                htmlFor={`agreement-accepted-${item.id}`}
                className="text-sm font-normal leading-relaxed text-muted-foreground"
              >
                I have read and agree to the {item.title}. I understand that checking this box
                constitutes my electronic signature.
              </Label>
            </div>

            <Button type="submit" disabled={isSubmitting || !accepted || clientSignerName.length < 2}>
              {isSubmitting ? 'Signing…' : 'Sign Agreement'}
            </Button>
          </form>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

export function PortalAgreementSection({
  clientProfile,
  clientTimezone,
  agreements,
  showSignedAgreementNotice = false,
  readOnly = false,
  consultationRequestId,
  initialAccordionCollapsed = false,
  showAddAgreementButton = false,
  projectId = null,
}: PortalAgreementSectionProps) {
  const [statusById, setStatusById] = useState<Record<string, PortalAgreementStatus>>(() =>
    Object.fromEntries(agreements.map((item) => [item.id, item.status]))
  );
  const [addAgreementOpen, setAddAgreementOpen] = useState(false);

  useEffect(() => {
    setStatusById(Object.fromEntries(agreements.map((item) => [item.id, item.status])));
  }, [agreements]);

  const displayTimeZone = clientTimezone ?? getBrowserTimeZone();

  const openValues = useMemo(() => {
    return agreements
      .filter((item) => !statusById[item.id]?.signed)
      .map((item) => agreementAccordionValue(item.id));
  }, [agreements, statusById]);

  const [accordionOpen, setAccordionOpen] = useState<string[]>([]);

  useEffect(() => {
    if (initialAccordionCollapsed) {
      setAccordionOpen([]);
      return;
    }

    setAccordionOpen(openValues);
  }, [openValues, initialAccordionCollapsed]);

  function handleSigned(agreementId: string, status: PortalAgreementStatus) {
    setStatusById((current) => ({ ...current, [agreementId]: status }));
  }

  const mergedAgreements = agreements.map((item) => ({
    ...item,
    status: statusById[item.id] ?? item.status,
  }));

  return (
    <section className="mt-12 max-w-3xl" aria-labelledby="portal-agreement-heading">
      <h2 id="portal-agreement-heading" className="mb-4 text-2xl font-bold text-foreground">
        Agreements
      </h2>
      <p className="mb-6 text-muted-foreground">
        Agreements between all9s Solutions and {formatAgreementClientParty(clientProfile)}.
      </p>

      {mergedAgreements.length === 0 ? (
        <p className="text-sm text-muted-foreground">No agreements are available for this account yet.</p>
      ) : (
        <Accordion type="multiple" value={accordionOpen} onValueChange={setAccordionOpen}>
          {mergedAgreements.map((item) => (
            <PortalAgreementCard
              key={item.id}
              item={item}
              clientProfile={clientProfile}
              displayTimeZone={displayTimeZone}
              readOnly={readOnly}
              consultationRequestId={consultationRequestId}
              showSignedAgreementNotice={showSignedAgreementNotice}
              onSigned={handleSigned}
            />
          ))}
        </Accordion>
      )}

      {showAddAgreementButton && projectId ? (
        <>
          <Button
            type="button"
            variant="outline"
            className="mt-6 w-full"
            onClick={() => setAddAgreementOpen(true)}
          >
            Add Agreement
          </Button>
          <PortalAdminAddProjectAgreementDialog
            projectId={projectId}
            open={addAgreementOpen}
            onOpenChange={setAddAgreementOpen}
          />
        </>
      ) : null}
    </section>
  );
}

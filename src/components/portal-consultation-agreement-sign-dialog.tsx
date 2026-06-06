'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PortalAgreementBody } from '@/components/portal-agreement-body';
import {
  buildPortalAgreementSignatureRenderContext,
  PortalAgreementSignatureBlock,
  portalAgreementSignatureHeadingForKind,
} from '@/components/portal-agreement-signature-block';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CONSULTATION_NAME_MAX_LENGTH } from '@/lib/field-lengths';
import {
  formatPortalSignedAt,
  getPortalAgreementContentSections,
  PORTAL_AGREEMENT_TITLE,
  type PortalAgreementStatus,
} from '@/lib/portal-agreement';
import { parseClientServiceAgreementId } from '@/lib/portal-agreement-data';
import { agreementPdfDownloadFilename } from '@/lib/portal-agreement-filename';
import { getPortalAgreementPdfPath, getPortalAgreementSignPath } from '@/lib/portal-agreement-paths';
import type { PortalConsultationRequestAgreement } from '@/lib/portal-consultation-requests-data';
import type { PortalClientProfile } from '@/lib/portal-user';
import { useToast } from '@/hooks/use-toast';
import { useSubmitGuard } from '@/hooks/use-submit-guard';

type PortalConsultationAgreementSignDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agreement: PortalConsultationRequestAgreement;
  clientProfile: PortalClientProfile;
  displayTimeZone: string;
  onAgreementChange: (agreement: PortalConsultationRequestAgreement) => void;
};

export function PortalConsultationAgreementSignDialog({
  open,
  onOpenChange,
  agreement: initialAgreement,
  clientProfile,
  displayTimeZone,
  onAgreementChange,
}: PortalConsultationAgreementSignDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { isSubmitting, runGuardedSubmit } = useSubmitGuard();
  const [agreement, setAgreement] = useState(initialAgreement);
  const [signerName, setSignerName] = useState(clientProfile.name);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    setAgreement(initialAgreement);
  }, [initialAgreement]);

  useEffect(() => {
    if (!agreement.signed) {
      setSignerName(clientProfile.name);
    }
  }, [agreement.signed, clientProfile.name]);

  const signedLabel =
    agreement.signed && agreement.signedAt
      ? formatPortalSignedAt(agreement.signedAt, displayTimeZone)
      : null;

  const isClientServiceAgreement = parseClientServiceAgreementId(agreement.id) != null;

  const clientServiceSections = useMemo(() => {
    if (!isClientServiceAgreement) {
      return null;
    }

    return getPortalAgreementContentSections();
  }, [isClientServiceAgreement]);

  const signatureContext = useMemo(
    () =>
      buildPortalAgreementSignatureRenderContext({
        clientProfile,
        timeZone: displayTimeZone,
        clientAccepted: accepted && !agreement.signed,
        signed: agreement.signed,
        signerName: agreement.signerName,
        signedAt: agreement.signedAt,
        signedAtLabel: signedLabel,
      }),
    [accepted, agreement, clientProfile, displayTimeZone, signedLabel]
  );

  const agreementKind = isClientServiceAgreement ? 'client' : 'project';
  const hasAgreementBody =
    isClientServiceAgreement || Boolean(agreement.body?.trim());

  function applyStatus(status: PortalAgreementStatus) {
    const next: PortalConsultationRequestAgreement = {
      id: agreement.id,
      title: agreement.title,
      body: agreement.body,
      signed: status.signed,
      signerName: status.signerName,
      signedAt: status.signedAt,
    };
    setAgreement(next);
    onAgreementChange(next);
  }

  async function handleSign(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await runGuardedSubmit(async () => {
      const res = await fetch(getPortalAgreementSignPath(agreement.id), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signerName,
          accepted,
          signedAt: new Date().toISOString(),
          clientTimeZone: displayTimeZone,
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

      applyStatus(data.agreement);
      setAccepted(false);
      onOpenChange(false);
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

  const agreementTitle = agreement.title || PORTAL_AGREEMENT_TITLE;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,48rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12 text-left">
          <DialogTitle>{agreementTitle}</DialogTitle>
          <DialogDescription>
            Review the agreement below. Your signature is required for this project.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {agreement.signed && agreement.signerName ? (
            <p className="mb-4 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground">
              Signed by <span className="font-medium">{agreement.signerName}</span>
              {signedLabel ? <> on {signedLabel}</> : null}.
            </p>
          ) : null}

          <div className="space-y-4 rounded-md border border-border bg-muted/20 p-4 text-sm leading-relaxed text-muted-foreground">
            {isClientServiceAgreement && clientServiceSections
              ? clientServiceSections.map((section) => (
                  <div key={section.heading}>
                    <h3 className="mb-1 font-semibold text-foreground">{section.heading}</h3>
                    <PortalAgreementBody section={section} />
                  </div>
                ))
              : null}
            {!isClientServiceAgreement ? (
              agreement.body?.trim() ? (
                <p className="whitespace-pre-wrap text-foreground">{agreement.body.trim()}</p>
              ) : (
                <p>Agreement text is not available yet. Contact all9s Solutions if you need a copy.</p>
              )
            ) : null}
            <PortalAgreementSignatureBlock
              clientProfile={clientProfile}
              timeZone={displayTimeZone}
              clientAccepted={signatureContext.clientAccepted}
              signature={signatureContext.signature}
              heading={portalAgreementSignatureHeadingForKind(agreementKind)}
              separated={hasAgreementBody}
            />
          </div>

          {agreement.signed ? (
            <p className="mt-4 text-sm text-muted-foreground">
              This agreement is on file. Close this window and use{' '}
              <span className="font-medium text-foreground">Download agreement PDF</span> to save a copy.
            </p>
          ) : (
            <form className="mt-6 space-y-4" id="consultation-agreement-sign-form" onSubmit={handleSign}>
              <div className="flex items-start gap-3">
                <input
                  id="consultation-agreement-accepted"
                  type="checkbox"
                  checked={accepted}
                  onChange={(event) => setAccepted(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <Label
                  htmlFor="consultation-agreement-accepted"
                  className="text-sm font-normal leading-relaxed text-muted-foreground"
                >
                  I have read and agree to the {agreementTitle}. I understand that typing my name below
                  constitutes my electronic signature.
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="consultation-agreement-signer-name">Full legal name</Label>
                <Input
                  id="consultation-agreement-signer-name"
                  value={signerName}
                  onChange={(event) => setSignerName(event.target.value)}
                  autoComplete="name"
                  required
                  maxLength={CONSULTATION_NAME_MAX_LENGTH}
                  placeholder="Jane Client"
                />
              </div>
            </form>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-border px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {agreement.signed ? null : (
            <Button
              type="submit"
              form="consultation-agreement-sign-form"
              disabled={isSubmitting || !accepted || signerName.trim().length < 2}
            >
              {isSubmitting ? 'Signing…' : 'Sign Agreement'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

type PortalConsultationAgreementDownloadOptions = {
  agreement: PortalConsultationRequestAgreement;
  onError: (message: string) => void;
};

export async function downloadConsultationAgreementPdf({
  agreement,
  onError,
}: PortalConsultationAgreementDownloadOptions): Promise<void> {
  const res = await fetch(getPortalAgreementPdfPath(agreement.id));
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    onError(data?.error ?? 'Download failed');
    return;
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = agreementPdfDownloadFilename(agreement.title);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

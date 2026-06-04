'use client';

import { useEffect, useState } from 'react';
import { Download, FileSignature } from 'lucide-react';
import {
  downloadConsultationAgreementPdf,
  PortalConsultationAgreementSignDialog,
} from '@/components/portal-consultation-agreement-sign-dialog';
import { Button } from '@/components/ui/button';
import {
  getBrowserTimeZone,
  PORTAL_AGREEMENT_TITLE,
  PORTAL_AGREEMENT_TITLE_SHORT,
} from '@/lib/portal-agreement';
import type { PortalConsultationRequestAgreement } from '@/lib/portal-consultation-requests-data';
import type { PortalClientProfile } from '@/lib/portal-user';
import { useToast } from '@/hooks/use-toast';

type PortalConsultationRequestAgreementRowProps = {
  agreement: PortalConsultationRequestAgreement;
  clientProfile: PortalClientProfile;
  clientTimezone: string | null;
};

export function PortalConsultationRequestAgreementRow({
  agreement: initialAgreement,
  clientProfile,
  clientTimezone,
}: PortalConsultationRequestAgreementRowProps) {
  const { toast } = useToast();
  const [agreement, setAgreement] = useState(initialAgreement);
  const [signDialogOpen, setSignDialogOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    setAgreement(initialAgreement);
  }, [initialAgreement]);

  const displayTimeZone = clientTimezone ?? getBrowserTimeZone();

  async function handleDownload() {
    setIsDownloading(true);
    try {
      await downloadConsultationAgreementPdf({
        agreement,
        onError: (message) => {
          toast({
            variant: 'destructive',
            title: 'Unable to download PDF',
            description: message,
          });
        },
      });
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
    <>
      <div className="mt-6 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p
          className="min-w-0 truncate text-sm font-medium text-foreground"
          title={PORTAL_AGREEMENT_TITLE}
        >
          {PORTAL_AGREEMENT_TITLE_SHORT}
        </p>
        {agreement.signed ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full shrink-0 sm:w-auto"
            disabled={isDownloading}
            onClick={handleDownload}
          >
            <Download className="h-4 w-4" />
            {isDownloading ? 'Downloading…' : 'Download PDF'}
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full shrink-0 sm:w-auto"
            onClick={() => setSignDialogOpen(true)}
          >
            <FileSignature className="h-4 w-4" />
            Review & Sign
          </Button>
        )}
      </div>

      <PortalConsultationAgreementSignDialog
        open={signDialogOpen}
        onOpenChange={setSignDialogOpen}
        agreement={agreement}
        clientProfile={clientProfile}
        displayTimeZone={displayTimeZone}
        onAgreementChange={setAgreement}
      />
    </>
  );
}

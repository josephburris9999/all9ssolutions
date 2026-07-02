'use client';

import { useMemo } from 'react';
import { PortalAgreementBody } from '@/components/portal-agreement-body';
import {
  buildPortalAgreementSignatureSection,
  PORTAL_AGREEMENT_SIGNATURE_SECTION_HEADING,
  PORTAL_AGREEMENT_SIGNATURE_SECTION_HEADING_DEFAULT,
  type PortalAgreementRenderContext,
  type PortalAgreementSignatureDetails,
} from '@/lib/portal-agreement';
import type { PortalClientProfile } from '@/lib/portal-user';
import { cn } from '@/lib/utils';

export type PortalAgreementSignatureBlockProps = {
  clientProfile: PortalClientProfile;
  timeZone: string;
  /** When true and unsigned, preview today's date in the Client signature area. */
  clientAccepted?: boolean;
  signature?: PortalAgreementSignatureDetails;
  /** CSA uses the numbered heading; custom agreements use the default. */
  heading?: string;
  className?: string;
  /** Adds a top border when the block follows agreement body content. */
  separated?: boolean;
};

export function buildPortalAgreementSignatureRenderContext(options: {
  clientProfile: PortalClientProfile;
  timeZone: string;
  clientAccepted?: boolean;
  signed?: boolean;
  signerName?: string | null;
  signedAt?: string | null;
  signedAtLabel?: string | null;
}): PortalAgreementRenderContext {
  const signature =
    options.signed &&
    options.signerName &&
    options.signedAt &&
    options.signedAtLabel
      ? {
          signerName: options.signerName,
          signedAt: options.signedAt,
          signedAtLabel: options.signedAtLabel,
        }
      : undefined;

  return {
    client: options.clientProfile,
    timeZone: options.timeZone,
    clientAccepted: options.clientAccepted,
    signature,
  };
}

export function portalAgreementSignatureHeadingForKind(kind: 'client' | 'project'): string {
  return kind === 'client'
    ? PORTAL_AGREEMENT_SIGNATURE_SECTION_HEADING
    : PORTAL_AGREEMENT_SIGNATURE_SECTION_HEADING_DEFAULT;
}

export function PortalAgreementSignatureBlock({
  clientProfile,
  timeZone,
  clientAccepted = false,
  signature,
  heading = PORTAL_AGREEMENT_SIGNATURE_SECTION_HEADING_DEFAULT,
  className,
  separated = false,
}: PortalAgreementSignatureBlockProps) {
  const section = useMemo(
    () =>
      buildPortalAgreementSignatureSection(
        {
          client: clientProfile,
          timeZone,
          clientAccepted,
          signature,
        },
        heading
      ),
    [clientAccepted, clientProfile, heading, signature, timeZone]
  );

  return (
    <div
      className={cn(
        'space-y-3',
        separated ? 'mt-4 border-t border-border pt-4' : null,
        className
      )}
    >
      <h3 className="font-semibold text-foreground">{section.heading}</h3>
      <PortalAgreementBody section={section} />
    </div>
  );
}

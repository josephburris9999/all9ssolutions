'use client';

import { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  PortalConsultationEditableFields,
  type PortalConsultationEditableFieldsInfo,
} from '@/components/portal-consultation-editable-fields';

type PortalClientHeroInfoProps = {
  info: PortalConsultationEditableFieldsInfo;
  consultationRequestId?: string;
  allowCreatePortalAccount?: boolean;
  /** When true, request message is shown in a separate Requests section instead. */
  hideRequestInHero?: boolean;
  /** Client portal: hide admin credential fields in the accordion. */
  hidePortalCredentials?: boolean;
  /** Client portal: show reset-password control in the accordion. */
  showClientPasswordReset?: boolean;
  /** Client portal: read-only name and company in the accordion. */
  allowEditNameAndCompany?: boolean;
};

function buildClientInfoSummary(info: PortalConsultationEditableFieldsInfo): string {
  const parts = [info.name.trim(), info.company?.trim()].filter(
    (part): part is string => Boolean(part && part.length > 0)
  );

  return parts.join(' · ');
}

export function PortalClientHeroInfo({
  info,
  consultationRequestId,
  allowCreatePortalAccount = false,
  hideRequestInHero = false,
  hidePortalCredentials = false,
  showClientPasswordReset = false,
  allowEditNameAndCompany = true,
}: PortalClientHeroInfoProps) {
  const [openValues, setOpenValues] = useState<string[]>(() =>
    showClientPasswordReset && (info.mustChangePassword ?? false) ? ['client-info'] : []
  );
  const summary = buildClientInfoSummary(info);

  const fields = (
    <PortalConsultationEditableFields
      info={info}
      consultationRequestId={consultationRequestId}
      allowCreatePortalAccount={allowCreatePortalAccount}
      hideRequestMessage={hideRequestInHero}
      hidePortalCredentials={hidePortalCredentials}
      showClientPasswordReset={showClientPasswordReset}
      allowEditNameAndCompany={allowEditNameAndCompany}
    />
  );

  return (
    <Accordion type="single" value={openValues} onValueChange={setOpenValues} className="w-full">
      <AccordionItem value="client-info">
        <AccordionTrigger value="client-info">
          <span className="flex min-w-0 flex-col items-start gap-0.5 text-left">
            <span className="font-medium">Client information</span>
            {summary ? (
              <span className="w-full truncate text-xs font-normal text-muted-foreground">{summary}</span>
            ) : null}
          </span>
        </AccordionTrigger>
        <AccordionContent value="client-info">{fields}</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

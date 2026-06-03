export type PortalConsultationRequestAgreement = {
  id: string;
  title: string;
  body: string | null;
  signed: boolean;
  signerName: string | null;
  signedAt: string | null;
};

export type PortalConsultationRequestDetail = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  preferredContact: 'e' | 'p';
  timezone: string | null;
  message: string;
  createdAt: string;
  updatedAt: string;
  projectId: string | null;
  projectTitle: string | null;
  emailDeliveryStatus: 'delivered' | 'bounced' | null;
  emailBouncedAt: string | null;
  /** Client Service Agreement for this consultation. */
  clientServiceAgreement: PortalConsultationRequestAgreement;
};

/** Project linked to a consultation request (for UI fallbacks). */
export type PortalConsultationRequestLinkedProject = {
  id: string;
  title: string;
  consultationRequestId: string;
};

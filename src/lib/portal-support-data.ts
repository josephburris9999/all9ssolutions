export type PortalSupportMessageKind = 'REQUEST' | 'ANSWER';

export type PortalSupportMessage = {
  id: string;
  kind: PortalSupportMessageKind;
  body: string;
  createdAt: string;
};

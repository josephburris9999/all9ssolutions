import 'server-only';

import { getPortalAdminDisplayName } from '@/lib/portal-admin-display';
import { getPortalSession } from '@/lib/portal-auth';
import { prisma } from '@/lib/prisma';
import { PORTAL_ROLE_ADMIN } from '@/lib/portal-role-data';

/** Resolve the signed-in admin's display name from their portal account — never client preview data. */
export async function resolvePortalAdminSignedInDisplayName(options: {
  portalUserId: string;
  loginEmail: string;
}): Promise<string> {
  const linkedConsultation = await prisma.consultationRequest.findFirst({
    where: {
      portalUserId: options.portalUserId,
      portalUser: { role: PORTAL_ROLE_ADMIN },
    },
    orderBy: { createdAt: 'asc' },
    select: { name: true },
  });

  const linkedName = linkedConsultation?.name?.trim();
  if (linkedName) {
    return linkedName;
  }

  return getPortalAdminDisplayName(options.loginEmail);
}

/** Signed-in label for admin portal pages and client preview views. */
export async function getPortalAdminSignedInDisplayName(): Promise<string> {
  const session = await getPortalSession();
  if (!session) {
    return 'Admin';
  }

  return resolvePortalAdminSignedInDisplayName({
    portalUserId: session.userId,
    loginEmail: session.email,
  });
}

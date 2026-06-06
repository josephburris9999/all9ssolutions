import 'server-only';

import { redirect } from 'next/navigation';
import { clearPortalSession } from '@/lib/portal-auth';
import { clientHasActivePortalProject } from '@/lib/portal-projects';
import { isPortalAdminRole } from '@/lib/portal-role-data';

export const CLIENT_PORTAL_NO_ACTIVE_PROJECT_MESSAGE =
  'Portal access requires an active project. Contact all9s Solutions if you need assistance.';

/** Redirects to `/portal` and clears the session when a client has no active projects. */
export async function ensureClientPortalAccess(session: {
  userId: string;
  role: string;
}): Promise<void> {
  if (isPortalAdminRole(session.role)) {
    return;
  }

  if (!(await clientHasActivePortalProject(session.userId))) {
    await clearPortalSession();
    redirect('/portal');
  }
}

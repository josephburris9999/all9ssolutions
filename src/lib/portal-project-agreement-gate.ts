import 'server-only';

import { areAllPortalAgreementsSigned } from '@/lib/portal-agreement-data';
export { PORTAL_PROJECT_AGREEMENTS_UNSIGNED_MESSAGE } from '@/lib/portal-agreement-data';
import { listPortalAgreementsForClientProject } from '@/lib/project-agreement-store';

export async function areAllPortalAgreementsSignedForProject(
  portalUserId: string,
  projectId: string
): Promise<boolean> {
  const agreements = await listPortalAgreementsForClientProject(portalUserId, projectId);
  return areAllPortalAgreementsSigned(agreements);
}

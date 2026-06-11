import type {
  PortalConsultationRequestDetail,
  PortalConsultationRequestLinkedProject,
} from '@/lib/portal-consultation-requests-data';

export type ResolvedConsultationRequestProject = {
  projectId: string;
  projectTitle: string | null;
};

/** Resolves a consultation request to an openable project, optionally restricted to active ids. */
export function resolveConsultationRequestProject(
  request: PortalConsultationRequestDetail,
  linkedProjects?: PortalConsultationRequestLinkedProject[],
  allowedProjectIds?: ReadonlySet<string>
): ResolvedConsultationRequestProject | null {
  const candidate =
    request.projectId != null
      ? { projectId: request.projectId, projectTitle: request.projectTitle }
      : (() => {
          const linked = linkedProjects?.find(
            (project) => project.consultationRequestId === request.id
          );
          if (!linked) {
            return null;
          }
          return {
            projectId: linked.id,
            projectTitle: linked.title.trim() || null,
          };
        })();

  if (!candidate) {
    return null;
  }

  if (allowedProjectIds && !allowedProjectIds.has(candidate.projectId)) {
    return null;
  }

  return candidate;
}

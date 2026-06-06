import { PortalAdminUpdateEstimatedCompletion } from '@/components/portal-admin-update-estimated-completion';
import { PortalProjectTimeline } from '@/components/portal-project-timeline';
import type { PortalProjectTimelineData } from '@/lib/portal-timeline-data';

type PortalAdminProjectTimelineSectionProps = {
  projects: PortalProjectTimelineData[];
  referenceNow: string;
  projectId: string;
  description?: string;
  emptyMessage?: string;
};

/** Admin-only timeline section with update estimated completion controls. */
export function PortalAdminProjectTimelineSection({
  projects,
  referenceNow,
  projectId,
  description,
  emptyMessage,
}: PortalAdminProjectTimelineSectionProps) {
  return (
    <PortalProjectTimeline
      projects={projects}
      referenceNow={referenceNow}
      description={description}
      emptyMessage={emptyMessage}
      actions={
        projects.length > 0 ? (
          <PortalAdminUpdateEstimatedCompletion
            key="update-estimated-completion"
            projectId={projectId}
            projects={projects}
            referenceNow={referenceNow}
          />
        ) : null
      }
    />
  );
}

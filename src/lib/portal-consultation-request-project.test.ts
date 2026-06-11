import { describe, expect, it } from 'vitest';
import { resolveConsultationRequestProject } from './portal-consultation-request-project';
import type {
  PortalConsultationRequestDetail,
  PortalConsultationRequestLinkedProject,
} from './portal-consultation-requests-data';

function request(
  overrides: Partial<PortalConsultationRequestDetail> = {}
): PortalConsultationRequestDetail {
  return {
    id: 'req-1',
    name: 'Client',
    email: 'client@example.com',
    phone: null,
    company: null,
    preferredContact: 'e',
    timezone: null,
    message: '',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    projectId: null,
    projectTitle: null,
    emailDeliveryStatus: null,
    emailBouncedAt: null,
    clientServiceAgreement: {
      id: 'csa-1',
      title: 'Client Service Agreement',
      body: null,
      signed: false,
      signerName: null,
      signedAt: null,
    },
    clientDiscussion: null,
    ...overrides,
  };
}

const linkedProjects: PortalConsultationRequestLinkedProject[] = [
  {
    id: 'project-active',
    title: 'Active project',
    consultationRequestId: 'req-1',
  },
  {
    id: 'project-completed',
    title: 'Completed project',
    consultationRequestId: 'req-2',
  },
];

describe('resolveConsultationRequestProject', () => {
  it('uses the request project id when present', () => {
    expect(
      resolveConsultationRequestProject(
        request({ projectId: 'project-on-row', projectTitle: 'Row project' })
      )
    ).toEqual({
      projectId: 'project-on-row',
      projectTitle: 'Row project',
    });
  });

  it('falls back to linked projects by consultation id', () => {
    expect(resolveConsultationRequestProject(request(), linkedProjects)).toEqual({
      projectId: 'project-active',
      projectTitle: 'Active project',
    });
  });

  it('returns null when no project is linked', () => {
    expect(resolveConsultationRequestProject(request({ id: 'missing' }), linkedProjects)).toBeNull();
  });

  it('filters out projects not in the allowed active set', () => {
    const allowed = new Set(['project-active']);

    expect(
      resolveConsultationRequestProject(
        request({ projectId: 'project-completed', projectTitle: 'Completed project' }),
        linkedProjects,
        allowed
      )
    ).toBeNull();

    expect(
      resolveConsultationRequestProject(
        request({ projectId: 'project-active', projectTitle: 'Active project' }),
        linkedProjects,
        allowed
      )
    ).toEqual({
      projectId: 'project-active',
      projectTitle: 'Active project',
    });
  });
});

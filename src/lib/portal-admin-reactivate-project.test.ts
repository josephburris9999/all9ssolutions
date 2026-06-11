import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reactivateProject } from './portal-admin-reactivate-project';

const { findUnique, update } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  update: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    project: {
      findUnique,
      update,
    },
  },
}));

describe('reactivateProject', () => {
  beforeEach(() => {
    findUnique.mockReset();
    update.mockReset();
  });

  it('marks a completed project active', async () => {
    findUnique.mockResolvedValue({
      id: 'project-1',
      status: 'COMPLETED',
      consultationRequestId: 'consult-1',
    });
    update.mockResolvedValue({});

    await expect(reactivateProject('project-1')).resolves.toEqual({
      consultationRequestId: 'consult-1',
    });

    expect(update).toHaveBeenCalledWith({
      where: { id: 'project-1' },
      data: { status: 'ACTIVE' },
    });
  });

  it('throws when the project does not exist', async () => {
    findUnique.mockResolvedValue(null);

    await expect(reactivateProject('missing')).rejects.toEqual(
      expect.objectContaining({ code: 'NOT_FOUND' })
    );
  });

  it('throws when the project is not completed', async () => {
    findUnique.mockResolvedValue({
      id: 'project-1',
      status: 'ACTIVE',
      consultationRequestId: 'consult-1',
    });

    await expect(reactivateProject('project-1')).rejects.toEqual(
      expect.objectContaining({ code: 'NOT_COMPLETED' })
    );
  });
});

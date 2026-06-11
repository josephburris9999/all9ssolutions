import { beforeEach, describe, expect, it, vi } from 'vitest';
import { completeProject } from './portal-admin-complete-project';

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

describe('completeProject', () => {
  beforeEach(() => {
    findUnique.mockReset();
    update.mockReset();
  });

  it('marks an active project completed', async () => {
    findUnique.mockResolvedValue({
      id: 'project-1',
      status: 'ACTIVE',
      consultationRequestId: 'consult-1',
    });
    update.mockResolvedValue({});

    await expect(completeProject('project-1')).resolves.toEqual({
      consultationRequestId: 'consult-1',
    });

    expect(update).toHaveBeenCalledWith({
      where: { id: 'project-1' },
      data: { status: 'COMPLETED' },
    });
  });

  it('throws when the project does not exist', async () => {
    findUnique.mockResolvedValue(null);

    await expect(completeProject('missing')).rejects.toEqual(
      expect.objectContaining({ code: 'NOT_FOUND' })
    );
  });

  it('throws when the project is already completed', async () => {
    findUnique.mockResolvedValue({
      id: 'project-1',
      status: 'COMPLETED',
      consultationRequestId: 'consult-1',
    });

    await expect(completeProject('project-1')).rejects.toEqual(
      expect.objectContaining({ code: 'ALREADY_COMPLETED' })
    );
  });
});

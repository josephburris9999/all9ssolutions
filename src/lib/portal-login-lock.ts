import { prisma } from '@/lib/prisma';

export const MAX_FAILED_LOGIN_ATTEMPTS = 5;

export const GENERIC_LOGIN_ERROR = 'Invalid email or password';

export const LOCKED_ACCOUNT_ERROR =
  'Your account has been locked after multiple failed sign-in attempts. Please contact all9s Solutions support.';

export function isPortalUserLocked(user: { lockedAt: Date | null; failedLoginAttempts: number }): boolean {
  return user.lockedAt !== null || user.failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS;
}

export async function resetPortalLoginAttempts(userId: string): Promise<void> {
  await prisma.portalUser.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: 0,
      lockedAt: null,
    },
  });
}

/** Increments failed attempts; locks the account when the limit is reached. Returns true if now locked. */
export async function recordFailedPortalLogin(userId: string): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const user = await tx.portalUser.update({
      where: { id: userId },
      data: { failedLoginAttempts: { increment: 1 } },
      select: { failedLoginAttempts: true, lockedAt: true },
    });

    if (user.failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS && user.lockedAt === null) {
      await tx.portalUser.update({
        where: { id: userId },
        data: { lockedAt: new Date() },
      });
      return true;
    }

    return isPortalUserLocked(user);
  });
}

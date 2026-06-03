import 'server-only';

import { hashPassword } from '@/lib/password';
import { PORTAL_DEFAULT_CLIENT_PASSWORD } from '@/lib/portal-default-password';
import { prisma } from '@/lib/prisma';
import { isPortalAdminRole, PORTAL_ROLE_CLIENT } from '@/lib/portal-role-data';
import { generateTemporaryPortalPassword } from '@/lib/portal-temporary-password';
import {
  findLinkedPortalUserIdByConsultationEmail,
  normalizePortalEmail,
} from '@/lib/portal-user';

export type ProvisionPortalUserResult = {
  portalUserId: string;
  created: boolean;
  linkedExistingUser: boolean;
  temporaryPassword: string | null;
};

export class PortalUserProvisionError extends Error {
  constructor(
    message: string,
    readonly code: 'NOT_FOUND' | 'ALREADY_EXISTS' | 'INVALID_STATE'
  ) {
    super(message);
    this.name = 'PortalUserProvisionError';
  }
}

/** Dev-friendly default when PORTAL_PROVISION_PASSWORD is unset; random in production. */
export function resolveProvisionPassword(): string {
  const configured = process.env.PORTAL_PROVISION_PASSWORD?.trim();
  if (configured) {
    return configured;
  }

  if (process.env.NODE_ENV !== 'production') {
    return PORTAL_DEFAULT_CLIENT_PASSWORD;
  }

  return generateTemporaryPortalPassword();
}

export async function provisionPortalUserForConsultation(
  consultationRequestId: string
): Promise<ProvisionPortalUserResult> {
  const consultation = await prisma.consultationRequest.findUnique({
    where: { id: consultationRequestId },
    select: {
      id: true,
      email: true,
      portalUserId: true,
      portalUser: {
        select: { role: true },
      },
    },
  });

  if (!consultation) {
    throw new PortalUserProvisionError('Consultation not found', 'NOT_FOUND');
  }

  if (
    consultation.portalUserId &&
    consultation.portalUser &&
    !isPortalAdminRole(consultation.portalUser.role)
  ) {
    throw new PortalUserProvisionError('This client already has a portal account', 'ALREADY_EXISTS');
  }

  const normalizedEmail = normalizePortalEmail(consultation.email);
  const existingPortalUserId = await findLinkedPortalUserIdByConsultationEmail(normalizedEmail);

  if (existingPortalUserId) {
    await prisma.consultationRequest.updateMany({
      where: {
        email: {
          equals: normalizedEmail,
          mode: 'insensitive',
        },
        portalUserId: null,
      },
      data: { portalUserId: existingPortalUserId },
    });

    return {
      portalUserId: existingPortalUserId,
      created: false,
      linkedExistingUser: true,
      temporaryPassword: null,
    };
  }

  const temporaryPassword = resolveProvisionPassword();
  const passwordHash = await hashPassword(temporaryPassword);

  const portalUser = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.portalUser.create({
      data: {
        role: PORTAL_ROLE_CLIENT,
        passwordHash,
        mustChangePassword: true,
      },
      select: { id: true },
    });

    await tx.consultationRequest.updateMany({
      where: {
        email: {
          equals: normalizedEmail,
          mode: 'insensitive',
        },
        portalUserId: null,
      },
      data: { portalUserId: createdUser.id },
    });

    return createdUser;
  });

  return {
    portalUserId: portalUser.id,
    created: true,
    linkedExistingUser: false,
    temporaryPassword,
  };
}

export async function resetPortalUserCredentialsForConsultation(
  consultationRequestId: string
): Promise<{ portalUserId: string; clientEmail: string; clientName: string }> {
  const consultation = await prisma.consultationRequest.findUnique({
    where: { id: consultationRequestId },
    select: {
      name: true,
      email: true,
      portalUserId: true,
      portalUser: {
        select: { role: true },
      },
    },
  });

  if (!consultation) {
    throw new PortalUserProvisionError('Consultation not found', 'NOT_FOUND');
  }

  if (
    !consultation.portalUserId ||
    !consultation.portalUser ||
    isPortalAdminRole(consultation.portalUser.role)
  ) {
    throw new PortalUserProvisionError('This client does not have a portal account', 'INVALID_STATE');
  }

  const passwordHash = await hashPassword(PORTAL_DEFAULT_CLIENT_PASSWORD);

  await prisma.portalUser.update({
    where: { id: consultation.portalUserId },
    data: {
      passwordHash,
      failedLoginAttempts: 0,
      lockedAt: null,
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
      mustChangePassword: true,
    },
  });

  return {
    portalUserId: consultation.portalUserId,
    clientEmail: consultation.email.trim(),
    clientName: consultation.name.trim(),
  };
}

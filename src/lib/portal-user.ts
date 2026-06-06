import { prisma } from '@/lib/prisma';
import { PORTAL_ROLE_CLIENT } from '@/lib/portal-role-data';
import { isValidIanaTimeZone } from '@/lib/timezones';

export function normalizePortalEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function consultationClientExistsByEmail(email: string): Promise<boolean> {
  const normalizedEmail = normalizePortalEmail(email);

  const existing = await prisma.consultationRequest.findFirst({
    where: {
      email: {
        equals: normalizedEmail,
        mode: 'insensitive',
      },
    },
    select: { id: true },
  });

  return existing !== null;
}

/** Portal user id from another consultation row with the same email, if any. */
export async function findLinkedPortalUserIdByConsultationEmail(
  email: string
): Promise<string | null> {
  const normalizedEmail = normalizePortalEmail(email);

  const linkedConsultation = await prisma.consultationRequest.findFirst({
    where: {
      email: {
        equals: normalizedEmail,
        mode: 'insensitive',
      },
      portalUserId: { not: null },
      portalUser: {
        role: PORTAL_ROLE_CLIENT,
      },
    },
    select: { portalUserId: true },
    orderBy: { createdAt: 'asc' },
  });

  return linkedConsultation?.portalUserId ?? null;
}

export async function findPortalUserByConsultationEmail(email: string) {
  const normalizedEmail = normalizePortalEmail(email);

  const links = await prisma.consultationRequest.findMany({
    where: {
      email: {
        equals: normalizedEmail,
        mode: 'insensitive',
      },
    },
    select: { portalUserId: true },
    orderBy: { createdAt: 'asc' },
  });

  const portalUserId = links.find((link) => link.portalUserId)?.portalUserId;
  if (!portalUserId) return null;

  return prisma.portalUser.findUnique({
    where: { id: portalUserId },
  });
}

export type PortalClientProfile = {
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  timezone: string | null;
  preferredContact: 'e' | 'p' | null;
};

function normalizePortalClientPreferredContact(value: string | null | undefined): 'e' | 'p' | null {
  if (value === 'p') {
    return 'p';
  }
  if (value === 'e') {
    return 'e';
  }
  return null;
}

function normalizePortalClientTimezone(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed && isValidIanaTimeZone(trimmed) ? trimmed : null;
}

function pickPortalDisplayName(options: {
  agreementSignerName?: string | null;
  consultationNames: Array<string | null | undefined>;
}): string {
  const signerName = options.agreementSignerName?.trim();
  if (signerName) {
    return signerName;
  }

  for (const candidate of options.consultationNames) {
    const name = candidate?.trim();
    if (name) {
      return name;
    }
  }

  return 'Client';
}

async function resolvePortalClientIdentity(portalUserId: string, loginEmail: string) {
  const normalizedEmail = normalizePortalEmail(loginEmail);

  const [signedAgreement, consultations] = await Promise.all([
    prisma.clientAgreement.findFirst({
      where: {
        consultationRequest: {
          OR: [
            { portalUserId },
            {
              email: {
                equals: normalizedEmail,
                mode: 'insensitive',
              },
            },
          ],
        },
      },
      orderBy: { signedAt: 'desc' },
      select: { signerName: true },
    }),
    prisma.consultationRequest.findMany({
      where: {
        OR: [
          { portalUserId },
          {
            email: {
              equals: normalizedEmail,
              mode: 'insensitive',
            },
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
      select: {
        name: true,
        email: true,
        company: true,
        phone: true,
        timezone: true,
        preferredContact: true,
        portalUserId: true,
      },
    }),
  ]);

  const linkedConsultations = consultations.filter((row) => row.portalUserId === portalUserId);
  const profileConsultation = linkedConsultations[0] ?? consultations[0] ?? null;
  const nameCandidates = linkedConsultations.length > 0
    ? linkedConsultations.map((row) => row.name)
    : consultations.map((row) => row.name);

  const displayName = pickPortalDisplayName({
    agreementSignerName: signedAgreement?.signerName,
    consultationNames: nameCandidates,
  });

  return {
    displayName,
    profileConsultation,
    fallbackEmail: normalizedEmail,
  };
}

export async function getPortalClientProfile(
  portalUserId: string,
  fallbackEmail: string
): Promise<PortalClientProfile> {
  const { displayName, profileConsultation, fallbackEmail: loginEmail } =
    await resolvePortalClientIdentity(portalUserId, fallbackEmail);

  const email = profileConsultation?.email?.trim() || loginEmail;

  return {
    name: displayName,
    email,
    company: profileConsultation?.company?.trim() || null,
    phone: profileConsultation?.phone?.trim() || null,
    timezone: normalizePortalClientTimezone(profileConsultation?.timezone),
    preferredContact: normalizePortalClientPreferredContact(profileConsultation?.preferredContact),
  };
}

export async function getPortalClientName(portalUserId: string, fallbackEmail: string): Promise<string> {
  const { displayName } = await resolvePortalClientIdentity(portalUserId, fallbackEmail);
  return displayName;
}

/** Portal user display name from their linked consultation profile (not CSA signer name). */
export async function getPortalUserDisplayName(
  portalUserId: string,
  fallbackEmail: string
): Promise<string> {
  const normalizedEmail = normalizePortalEmail(fallbackEmail);

  const linkedConsultation = await prisma.consultationRequest.findFirst({
    where: { portalUserId },
    orderBy: { createdAt: 'asc' },
    select: { name: true },
  });

  const linkedName = linkedConsultation?.name?.trim();
  if (linkedName) {
    return linkedName;
  }

  const emailConsultation = await prisma.consultationRequest.findFirst({
    where: {
      email: {
        equals: normalizedEmail,
        mode: 'insensitive',
      },
    },
    orderBy: { createdAt: 'asc' },
    select: { name: true },
  });

  const emailName = emailConsultation?.name?.trim();
  if (emailName) {
    return emailName;
  }

  const localPart = fallbackEmail.trim().split('@')[0]?.trim();
  if (localPart) {
    return localPart;
  }

  return 'User';
}

/** Timezone for agreement timestamps: saved at sign-in, else consultation profile. */
export async function getClientAgreementTimeZone(
  portalUserId?: string | null,
  consultationRequestId?: string | null
): Promise<string | null> {
  if (consultationRequestId) {
    const agreement = await prisma.clientAgreement.findUnique({
      where: { consultationRequestId },
      select: { signedTimeZone: true },
    });

    const signedTz = agreement?.signedTimeZone?.trim();
    if (signedTz && isValidIanaTimeZone(signedTz)) {
      return signedTz;
    }
  }

  if (portalUserId) {
    const agreement = await prisma.clientAgreement.findFirst({
      where: {
        consultationRequest: {
          OR: [{ portalUserId }, { projects: { some: { portalUserId } } }],
        },
      },
      orderBy: { signedAt: 'desc' },
      select: { signedTimeZone: true },
    });

    const signedTz = agreement?.signedTimeZone?.trim();
    if (signedTz && isValidIanaTimeZone(signedTz)) {
      return signedTz;
    }

    return getPortalClientTimezone(portalUserId);
  }

  return null;
}

export async function getPortalClientTimezone(portalUserId: string): Promise<string | null> {
  const consultations = await prisma.consultationRequest.findMany({
    where: { portalUserId },
    orderBy: { createdAt: 'desc' },
    select: { timezone: true },
    take: 10,
  });

  for (const row of consultations) {
    const tz = row.timezone?.trim();
    if (tz && isValidIanaTimeZone(tz)) {
      return tz;
    }
  }

  return null;
}

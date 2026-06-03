/**
 * VARCHAR limits aligned with `prisma/schema.prisma`.
 * Use in Zod schemas and HTML `maxLength` attributes.
 */

/** `ConsultationRequest.name`, `Project.title`, agreement signer names, etc. */
export const CONSULTATION_NAME_MAX_LENGTH = 200;

/** `ConsultationRequest.email` and portal login / forgot-password email. */
export const CONSULTATION_EMAIL_MAX_LENGTH = 254;

/** `ConsultationRequest.phone` */
export const CONSULTATION_PHONE_MAX_LENGTH = 30;

/** `ConsultationRequest.timezone`, agreement `signedTimeZone`. */
export const CONSULTATION_TIMEZONE_MAX_LENGTH = 100;

/** `ConsultationRequest.company` */
export const CONSULTATION_COMPANY_MAX_LENGTH = 200;

/** `ConsultationRequest.message` */
export const CONSULTATION_MESSAGE_MAX_LENGTH = 10000;

/** Plaintext portal password (policy); fits in `PortalUser.passwordHash` (255). */
export const PORTAL_PASSWORD_MAX_LENGTH = 128;

/** `PortalContentUpload.fileName` */
export const PORTAL_UPLOAD_FILE_NAME_MAX_LENGTH = 255;

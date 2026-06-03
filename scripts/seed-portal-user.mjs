/**
 * Ensures a ConsultationRequest and linked PortalUser exist for development sign-in.
 *
 * PortalUser has no email column — email lives on ConsultationRequest.
 *
 * Usage:
 *   npm run db:seed-portal
 *   PORTAL_SEED_EMAIL=client@example.com PORTAL_SEED_PASSWORD=TempPass123! npm run db:seed-portal
 *
 * Optional env:
 *   PORTAL_SEED_NAME, PORTAL_SEED_PHONE, PORTAL_SEED_TIMEZONE, PORTAL_SEED_COMPANY
 *   PORTAL_SEED_MESSAGE, PORTAL_SEED_PREFERRED_CONTACT=e|p, PORTAL_SEED_MUST_CHANGE=false
 *   PORTAL_SEED_ROLE=a (admin) or c (client, default)
 */
import 'dotenv/config';
import { createId, hashPassword, normalizeEmail } from './lib/portal-password.mjs';
import { createPgClient } from './lib/pg-client.mjs';

function getSeedConsultationDefaults() {
  return {
    name: (process.env.PORTAL_SEED_NAME ?? 'Portal Test Client').trim(),
    email: normalizeEmail(process.env.PORTAL_SEED_EMAIL ?? 'client@example.com'),
    phone: (process.env.PORTAL_SEED_PHONE ?? '').trim() || null,
    timezone: (process.env.PORTAL_SEED_TIMEZONE ?? '').trim() || null,
    preferredContact: process.env.PORTAL_SEED_PREFERRED_CONTACT === 'p' ? 'p' : 'e',
    company: (process.env.PORTAL_SEED_COMPANY ?? 'Portal Test Company').trim() || null,
    message: (process.env.PORTAL_SEED_MESSAGE ?? 'Seeded portal test account for development.').trim(),
  };
}

async function findConsultationForEmail(client, email) {
  const result = await client.query(
    `SELECT id, email, name, "portalUserId"
     FROM "ConsultationRequest"
     WHERE lower(trim(email)) = $1
     ORDER BY "createdAt" ASC`,
    [email]
  );

  return result.rows;
}

async function createConsultationRequest(client, data) {
  const consultationId = createId();

  await client.query(
    `INSERT INTO "ConsultationRequest"
     (id, "portalUserId", name, email, phone, timezone, "preferredContact", company, message, "createdAt", "updatedAt")
     VALUES ($1, NULL, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
    [
      consultationId,
      data.name,
      data.email,
      data.phone,
      data.timezone,
      data.preferredContact,
      data.company,
      data.message,
    ]
  );

  return { consultationId, created: true };
}

async function ensureConsultationRequest(client, data) {
  const existing = await findConsultationForEmail(client, data.email);

  if (existing.length > 0) {
    const row = existing[0];

    await client.query(
      `UPDATE "ConsultationRequest"
       SET name = $1,
           phone = COALESCE($2, phone),
           timezone = COALESCE($3, timezone),
           "preferredContact" = $4,
           company = COALESCE($5, company),
           message = COALESCE(NULLIF($6, ''), message),
           "updatedAt" = NOW()
       WHERE id = $7`,
      [data.name, data.phone, data.timezone, data.preferredContact, data.company, data.message, row.id]
    );

    console.log(`ConsultationRequest already exists for ${data.email}: ${row.id}`);
    return { consultationId: row.id, portalUserId: row.portalUserId, created: false };
  }

  const created = await createConsultationRequest(client, data);
  console.log(`Created ConsultationRequest ${created.consultationId}`);
  return { consultationId: created.consultationId, portalUserId: null, created: true };
}

async function ensurePortalUserForConsultation(client, consultationId, password, mustChangePassword, role) {
  const passwordHash = await hashPassword(password);

  const consultation = await client.query(
    `SELECT id, email, name, "portalUserId"
     FROM "ConsultationRequest"
     WHERE id = $1`,
    [consultationId]
  );

  if (consultation.rowCount === 0) {
    throw new Error(`ConsultationRequest not found: ${consultationId}`);
  }

  const row = consultation.rows[0];

  if (row.portalUserId) {
    await client.query(
      `UPDATE "PortalUser"
       SET "passwordHash" = $1,
           "mustChangePassword" = $2,
           role = $3,
           "failedLoginAttempts" = 0,
           "lockedAt" = NULL,
           "updatedAt" = NOW()
       WHERE id = $4`,
      [passwordHash, mustChangePassword, role, row.portalUserId]
    );

    return {
      portalUserId: row.portalUserId,
      consultationId,
      email: row.email,
      name: row.name,
      created: false,
    };
  }

  const portalUserId = createId();

  await client.query('BEGIN');
  try {
    await client.query(
      `INSERT INTO "PortalUser" (id, "passwordHash", "mustChangePassword", role, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [portalUserId, passwordHash, mustChangePassword, role]
    );

    await client.query(
      `UPDATE "ConsultationRequest"
       SET "portalUserId" = $1, "updatedAt" = NOW()
       WHERE id = $2`,
      [portalUserId, consultationId]
    );

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }

  return {
    portalUserId,
    consultationId,
    email: row.email,
    name: row.name,
    created: true,
  };
}

const password = process.env.PORTAL_SEED_PASSWORD ?? 'TempPass123!';
const mustChangePassword = process.env.PORTAL_SEED_MUST_CHANGE !== 'false';
const role = process.env.PORTAL_SEED_ROLE === 'a' ? 'a' : 'c';
const consultationData = getSeedConsultationDefaults();
const client = createPgClient();

try {
  await client.connect();

  const consultation = await ensureConsultationRequest(client, consultationData);
  const portal = await ensurePortalUserForConsultation(
    client,
    consultation.consultationId,
    password,
    mustChangePassword,
    role
  );

  console.log(portal.created ? 'Created PortalUser' : 'Updated PortalUser password');
  console.log(`ConsultationRequest: ${portal.consultationId}`);
  console.log(`PortalUser: ${portal.portalUserId}`);
  console.log(`Name: ${portal.name}`);
  console.log(`Email (ConsultationRequest): ${portal.email}`);
  console.log(`Password: ${password}`);
  console.log(`Must change password: ${mustChangePassword}`);
  console.log(`Role: ${role === 'a' ? 'admin' : 'client'} (${role})`);
  console.log('\nSign in at /portal');
} finally {
  await client.end();
}

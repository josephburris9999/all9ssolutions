#!/usr/bin/env node
/**
 * Insert a ConsultationRequest and a linked PortalUser (two DB steps in one command).
 *
 * Email is stored on ConsultationRequest only. Portal sign-in uses that email + portal password.
 *
 * Usage:
 *   npm run db:enter-consultation-portal
 *   npm run db:enter-consultation-portal -- --step=consultation
 *   npm run db:enter-consultation-portal -- --step=portal --consultation-id=YOUR_ID
 *
 * Env (optional):
 *   TEST_CONSULTATION_NAME, TEST_CONSULTATION_EMAIL, TEST_CONSULTATION_MESSAGE
 *   TEST_CONSULTATION_PHONE, TEST_CONSULTATION_TIMEZONE, TEST_CONSULTATION_COMPANY
 *   TEST_CONSULTATION_PREFERRED_CONTACT=e|p
 *   TEST_PORTAL_PASSWORD, TEST_PORTAL_MUST_CHANGE=false
 */
import 'dotenv/config';
import { createId, hashPassword, normalizeEmail } from './lib/portal-password.mjs';
import { createPgClient } from './lib/pg-client.mjs';

function parseArgs(argv) {
  const options = {
    step: 'both',
    consultationId: null,
    help: false,
  };

  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg.startsWith('--step=')) options.step = arg.slice('--step='.length).trim();
    else if (arg.startsWith('--consultation-id=')) {
      options.consultationId = arg.slice('--consultation-id='.length).trim();
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!['both', 'consultation', 'portal'].includes(options.step)) {
    throw new Error('--step must be one of: both, consultation, portal');
  }

  if (options.step === 'portal' && !options.consultationId) {
    throw new Error('--consultation-id is required when --step=portal');
  }

  return options;
}

function printHelp() {
  console.log(`Insert ConsultationRequest and PortalUser records.

Options:
  --step=both|consultation|portal   Run one or both steps (default: both)
  --consultation-id=<id>            Required for --step=portal
  --help, -h                        Show this help

Examples:
  npm run db:enter-consultation-portal
  npm run db:enter-consultation-portal -- --step=consultation
  npm run db:enter-consultation-portal -- --step=portal --consultation-id=clxyz123

Environment variables:
  TEST_CONSULTATION_EMAIL (default: test.client@example.com)
  TEST_PORTAL_PASSWORD (default: TempPass123!)
`);
}

function getConsultationDefaults() {
  return {
    name: (process.env.TEST_CONSULTATION_NAME ?? 'Test Client').trim(),
    email: normalizeEmail(process.env.TEST_CONSULTATION_EMAIL ?? 'test.client@example.com'),
    phone: (process.env.TEST_CONSULTATION_PHONE ?? '').trim() || null,
    timezone: (process.env.TEST_CONSULTATION_TIMEZONE ?? '').trim() || null,
    preferredContact: process.env.TEST_CONSULTATION_PREFERRED_CONTACT === 'p' ? 'p' : 'e',
    company: (process.env.TEST_CONSULTATION_COMPANY ?? 'Test Company').trim() || null,
    message: (process.env.TEST_CONSULTATION_MESSAGE ?? 'Test consultation request for portal development.').trim(),
  };
}

async function findConsultationForEmail(client, email) {
  const result = await client.query(
    `SELECT id, email, "portalUserId"
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

  return { consultationId, ...data, created: true };
}

async function ensureConsultationRequest(client) {
  const data = getConsultationDefaults();
  const existing = await findConsultationForEmail(client, data.email);

  if (existing.length > 0) {
    const row = existing[0];
    console.log(`ConsultationRequest already exists for ${data.email}: ${row.id}`);
    return { consultationId: row.id, ...data, created: false, portalUserId: row.portalUserId };
  }

  const created = await createConsultationRequest(client, data);
  console.log('Created ConsultationRequest');
  return created;
}

async function createPortalUserForConsultation(client, consultationId) {
  const password = process.env.TEST_PORTAL_PASSWORD ?? 'TempPass123!';
  const mustChangePassword = process.env.TEST_PORTAL_MUST_CHANGE !== 'false';
  const portalUserId = createId();
  const passwordHash = await hashPassword(password);

  const consultation = await client.query(
    `SELECT id, email, "portalUserId"
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
       SET "passwordHash" = $1, "mustChangePassword" = $2, "failedLoginAttempts" = 0, "lockedAt" = NULL, "updatedAt" = NOW()
       WHERE id = $3`,
      [passwordHash, mustChangePassword, row.portalUserId]
    );
    return {
      portalUserId: row.portalUserId,
      consultationId,
      email: row.email,
      password,
      mustChangePassword,
      created: false,
    };
  }

  await client.query('BEGIN');
  try {
    await client.query(
      `INSERT INTO "PortalUser" (id, "passwordHash", "mustChangePassword", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, NOW(), NOW())`,
      [portalUserId, passwordHash, mustChangePassword]
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
    password,
    mustChangePassword,
    created: true,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const client = createPgClient();

  try {
    await client.connect();

    let consultationResult = null;
    let portalResult = null;

    if (options.step === 'both' || options.step === 'consultation') {
      consultationResult = await ensureConsultationRequest(client);
      console.log(JSON.stringify(consultationResult, null, 2));
    }

    if (options.step === 'both' || options.step === 'portal') {
      const consultationId =
        options.consultationId ?? consultationResult?.consultationId ?? null;

      if (!consultationId) {
        throw new Error('No consultation id available for portal user creation');
      }

      portalResult = await createPortalUserForConsultation(client, consultationId);
      console.log(portalResult.created ? 'Created PortalUser' : 'Updated PortalUser password');
      console.log(JSON.stringify(portalResult, null, 2));
      console.log(`\nSign-in at /portal`);
      console.log(`  Email: ${portalResult.email}`);
      console.log(`  Password: ${portalResult.password}`);
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

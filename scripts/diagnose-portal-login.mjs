#!/usr/bin/env node
/**
 * Check portal sign-in prerequisites for a test email.
 *
 * Usage:
 *   npm run db:diagnose-portal-login
 *   TEST_CONSULTATION_EMAIL=test.client@example.com npm run db:diagnose-portal-login
 */
import 'dotenv/config';
import { promisify } from 'util';
import { scrypt, timingSafeEqual } from 'crypto';
import { normalizeEmail } from './lib/portal-password.mjs';
import { createPgClient } from './lib/pg-client.mjs';

const scryptAsync = promisify(scrypt);

async function verifyPassword(password, stored) {
  const [salt, hashHex] = stored.split(':');
  if (!salt || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const derived = await scryptAsync(password, salt, 64);
  if (expected.length !== derived.length) return false;
  return timingSafeEqual(expected, derived);
}

const email = normalizeEmail(process.env.TEST_CONSULTATION_EMAIL ?? 'test.client@example.com');
const password = process.env.TEST_PORTAL_PASSWORD ?? 'TempPass123!';

const client = createPgClient();

try {
  await client.connect();

  const tables = await client.query(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('ConsultationRequest', 'PortalUser') ORDER BY tablename`
  );
  console.log('Tables present:', tables.rows.map((row) => row.tablename).join(', ') || '(none)');

  const column = await client.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'ConsultationRequest' AND column_name = 'portalUserId'`
  );
  console.log('ConsultationRequest.portalUserId column:', column.rowCount > 0 ? 'yes' : 'missing');

  const consultations = await client.query(
    `SELECT id, email, "portalUserId" FROM "ConsultationRequest"
     WHERE lower(trim(email)) = $1
     ORDER BY "createdAt" ASC`,
    [email]
  );

  console.log(`\nConsultationRequest rows for ${email}: ${consultations.rowCount}`);
  for (const row of consultations.rows) {
    console.log(`  - id=${row.id} portalUserId=${row.portalUserId ?? 'NULL'}`);
  }

  const linked = consultations.rows.find((row) => row.portalUserId);
  if (!linked) {
    console.error('\nProblem: no ConsultationRequest with this email is linked to a PortalUser.');
    console.error('Fix: npm run db:migrate && npm run db:enter-consultation-portal');
    process.exit(1);
  }

  const portalUser = await client.query(
    `SELECT id, "passwordHash", "mustChangePassword", "failedLoginAttempts", "lockedAt"
     FROM "PortalUser" WHERE id = $1`,
    [linked.portalUserId]
  );

  if (portalUser.rowCount === 0) {
    console.error(`\nProblem: PortalUser ${linked.portalUserId} is missing.`);
    process.exit(1);
  }

  const user = portalUser.rows[0];
  const passwordOk = await verifyPassword(password, user.passwordHash);

  console.log(`\nPortalUser: id=${user.id} mustChangePassword=${user.mustChangePassword}`);
  console.log(`failedLoginAttempts=${user.failedLoginAttempts} lockedAt=${user.lockedAt ?? 'null'}`);
  console.log(`Password "${password}" matches hash: ${passwordOk ? 'yes' : 'no'}`);

  if (user.lockedAt) {
    console.error('\nProblem: account is locked. Re-run npm run db:enter-consultation-portal to reset dev test account.');
    process.exit(1);
  }

  if (!passwordOk) {
    console.error('\nProblem: stored password hash does not match TEST_PORTAL_PASSWORD / TempPass123!.');
    console.error('Fix: npm run db:migrate && npm run db:enter-consultation-portal');
    process.exit(1);
  }

  console.log('\nPortal login prerequisites look good for this test account.');
} catch (error) {
  console.error('\nDiagnostic failed:', error instanceof Error ? error.message : error);
  console.error('If PortalUser is missing, run: npm run db:migrate && npm run db:enter-consultation-portal');
  process.exit(1);
} finally {
  await client.end();
}

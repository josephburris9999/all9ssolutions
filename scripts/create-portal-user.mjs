#!/usr/bin/env node
/**
 * Create a PortalUser and link it to ConsultationRequest row(s) for the given email.
 *
 * Usage:
 *   npm run db:create-portal-user -- --email=client@example.com
 *   npm run db:create-portal-user -- --email=client@example.com --dry-run
 *   npm run db:create-portal-user -- --email=client@example.com --no-must-change
 *
 * Default password: TempPass123!
 */
import 'dotenv/config';
import { createId, hashPassword, normalizeEmail } from './lib/portal-password.mjs';
import { createPgClient } from './lib/pg-client.mjs';

const DEFAULT_PASSWORD = 'TempPass123!';

function parseArgs(argv) {
  const options = {
    email: (process.env.PORTAL_USER_EMAIL ?? '').trim(),
    mustChangePassword: true,
    dryRun: false,
    help: false,
  };

  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--no-must-change') options.mustChangePassword = false;
    else if (arg.startsWith('--email=')) options.email = arg.slice('--email='.length).trim();
    else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function printHelp() {
  console.log(`Create a PortalUser (password ${DEFAULT_PASSWORD}) linked to ConsultationRequest by email.

Options:
  --email=<address>   Client email (required; or set PORTAL_USER_EMAIL)
  --no-must-change    Allow sign-in without forcing a password change
  --dry-run           Print planned changes without writing
  --help, -h          Show this help

Examples:
  npm run db:create-portal-user -- --email=client@example.com
  npm run db:create-portal-user -- --email=client@example.com --dry-run

Requires DIRECT_URL or DATABASE_URL.
`);
}

async function fetchConsultationsByEmail(client, email) {
  const result = await client.query(
    `SELECT id, email, name, "portalUserId"
     FROM "ConsultationRequest"
     WHERE lower(trim(email)) = $1
     ORDER BY "createdAt" ASC`,
    [email]
  );
  return result.rows;
}

async function findPortalUserIdForEmail(client, email) {
  const result = await client.query(
    `SELECT DISTINCT "portalUserId"
     FROM "ConsultationRequest"
     WHERE lower(trim(email)) = $1 AND "portalUserId" IS NOT NULL
     LIMIT 1`,
    [email]
  );
  return result.rows[0]?.portalUserId ?? null;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  if (!options.email) {
    throw new Error('--email is required (or set PORTAL_USER_EMAIL)');
  }

  const email = normalizeEmail(options.email);
  const portalUserId = createId();
  const passwordHash = await hashPassword(DEFAULT_PASSWORD);

  const client = createPgClient();

  try {
    await client.connect();

    const consultations = await fetchConsultationsByEmail(client, email);
    if (consultations.length === 0) {
      throw new Error(
        `No ConsultationRequest found for ${email}. Submit a consultation first, then run this script.`
      );
    }

    const existingPortalUserId = await findPortalUserIdForEmail(client, email);
    if (existingPortalUserId) {
      throw new Error(
        `A portal user already exists for ${email} (${existingPortalUserId}). Use db:seed-portal or admin tools to reset credentials.`
      );
    }

    const linkIds = consultations.map((row) => row.id);
    const primary = consultations[0];

    if (options.dryRun) {
      console.log(
        JSON.stringify(
          {
            action: 'create',
            email,
            portalUserId,
            password: DEFAULT_PASSWORD,
            mustChangePassword: options.mustChangePassword,
            linkConsultationIds: linkIds,
            clientName: primary.name,
          },
          null,
          2
        )
      );
      console.log('\nDry run — no database changes were made.');
      return;
    }

    await client.query('BEGIN');
    try {
      await client.query(
        `INSERT INTO "PortalUser" (id, "passwordHash", "mustChangePassword", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, NOW(), NOW())`,
        [portalUserId, passwordHash, options.mustChangePassword]
      );

      await client.query(
        `UPDATE "ConsultationRequest"
         SET "portalUserId" = $1, "updatedAt" = NOW()
         WHERE id = ANY($2::varchar[])`,
        [portalUserId, linkIds]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }

    console.log(`Created PortalUser: ${portalUserId}`);
    console.log(`Linked consultation(s): ${linkIds.join(', ')}`);
    console.log(`Sign-in at /portal`);
    console.log(`  Email: ${email}`);
    console.log(`  Name: ${primary.name}`);
    console.log(`  Password: ${DEFAULT_PASSWORD}`);
    if (options.mustChangePassword) {
      console.log('  User must change password on first sign-in.');
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

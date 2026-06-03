#!/usr/bin/env node
/**
 * Create PortalUser accounts from ConsultationRequest rows and link them via portalUserId.
 *
 * Matches on normalized ConsultationRequest.email. One PortalUser per email; all unlinked
 * consultation rows with that email are linked to the same account.
 *
 * Usage:
 *   npm run db:provision-portal-users
 *   npm run db:provision-portal-users -- --dry-run
 *   npm run db:provision-portal-users -- --request-id=clxyz123
 */
import 'dotenv/config';
import {
  createId,
  generateTemporaryPassword,
  hashPassword,
  normalizeEmail,
} from './lib/portal-password.mjs';
import { createPgClient } from './lib/pg-client.mjs';

function parseArgs(argv) {
  const options = {
    dryRun: false,
    requestId: null,
    help: false,
  };

  for (const arg of argv) {
    if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg.startsWith('--request-id=')) options.requestId = arg.slice('--request-id='.length).trim();
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function printHelp() {
  console.log(`Provision PortalUser records from ConsultationRequest rows.

Options:
  --dry-run              Show planned changes without writing to the database
  --request-id=<id>      Process a single ConsultationRequest by id
  --help, -h             Show this help
`);
}

function groupConsultationsByEmail(rows) {
  const groups = new Map();

  for (const row of rows) {
    const email = normalizeEmail(row.email);
    if (!groups.has(email)) groups.set(email, []);
    groups.get(email).push(row);
  }

  return groups;
}

async function fetchConsultationRequests(client, requestId) {
  if (requestId) {
    const result = await client.query(
      `SELECT id, email, name, "portalUserId"
       FROM "ConsultationRequest"
       WHERE id = $1`,
      [requestId]
    );
    if (result.rowCount === 0) {
      throw new Error(`ConsultationRequest not found: ${requestId}`);
    }
    return result.rows;
  }

  const result = await client.query(
    `SELECT id, email, name, "portalUserId"
     FROM "ConsultationRequest"
     WHERE "portalUserId" IS NULL
     ORDER BY email ASC, "createdAt" ASC`
  );
  return result.rows;
}

async function findPortalUserIdByConsultationEmail(client, email) {
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

  const fixedPassword = (process.env.PORTAL_PROVISION_PASSWORD ?? '').trim() || null;
  const client = createPgClient();

  const summary = {
    processedEmails: 0,
    createdUsers: 0,
    linkedExistingUsers: 0,
    linkedConsultations: 0,
    skippedAlreadyLinked: 0,
    results: [],
  };

  try {
    await client.connect();

    const consultations = await fetchConsultationRequests(client, options.requestId);
    const toProcess = consultations.filter((row) => !row.portalUserId);
    summary.skippedAlreadyLinked = consultations.length - toProcess.length;

    if (toProcess.length === 0) {
      console.log('No unlinked ConsultationRequest rows to process.');
      if (summary.skippedAlreadyLinked > 0) {
        console.log(`${summary.skippedAlreadyLinked} row(s) already linked to a PortalUser.`);
      }
      return;
    }

    const groups = groupConsultationsByEmail(toProcess);

    for (const [email, rowsForEmail] of groups) {
      summary.processedEmails += 1;

      let portalUserId = await findPortalUserIdByConsultationEmail(client, email);
      let created = false;
      let temporaryPassword = null;

      if (!portalUserId) {
        portalUserId = createId();
        temporaryPassword = fixedPassword ?? generateTemporaryPassword();
        created = true;
      } else {
        summary.linkedExistingUsers += 1;
      }

      const consultationIds = rowsForEmail.map((row) => row.id);

      if (options.dryRun) {
        summary.results.push({
          email,
          portalUserId,
          created,
          linkedConsultationIds: consultationIds,
          temporaryPassword: created ? temporaryPassword : null,
        });
        summary.linkedConsultations += consultationIds.length;
        if (created) summary.createdUsers += 1;
        continue;
      }

      await client.query('BEGIN');
      try {
        if (created) {
          const passwordHash = await hashPassword(temporaryPassword);
          await client.query(
            `INSERT INTO "PortalUser" (id, "passwordHash", "mustChangePassword", "createdAt", "updatedAt")
             VALUES ($1, $2, true, NOW(), NOW())`,
            [portalUserId, passwordHash]
          );
          summary.createdUsers += 1;
        }

        await client.query(
          `UPDATE "ConsultationRequest"
           SET "portalUserId" = $1, "updatedAt" = NOW()
           WHERE id = ANY($2::varchar[])`,
          [portalUserId, consultationIds]
        );

        await client.query('COMMIT');
        summary.linkedConsultations += consultationIds.length;
        summary.results.push({
          email,
          portalUserId,
          created,
          linkedConsultationIds: consultationIds,
          temporaryPassword: created ? temporaryPassword : null,
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }

    console.log(JSON.stringify({ dryRun: options.dryRun, ...summary }, null, 2));

    if (options.dryRun) {
      console.log('\nDry run only — no database changes were made.');
    } else if (summary.createdUsers > 0) {
      console.log('\nNew portal users must change their password on first sign-in.');
      if (fixedPassword) {
        console.log(`Temporary password for new users: ${fixedPassword}`);
      } else {
        console.log('Temporary passwords for new users are listed in the results above.');
      }
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

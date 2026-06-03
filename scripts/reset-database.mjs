/**
 * Deletes all rows from every application table in the public schema.
 * Schema, migrations, and enums are preserved.
 *
 * Usage:
 *   npm run db:reset -- --confirm
 *   DB_RESET_CONFIRM=1 npm run db:reset
 *   npm run db:reset -- --dry-run
 */
import 'dotenv/config';
import { createPgClient } from './lib/pg-client.mjs';

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const confirmed = args.has('--confirm') || process.env.DB_RESET_CONFIRM === '1';

function requiresProductionOverride() {
  return process.env.NODE_ENV === 'production';
}

async function listPublicTables(client) {
  const result = await client.query(
    `SELECT tablename
     FROM pg_tables
     WHERE schemaname = 'public'
       AND tablename NOT IN ('_prisma_migrations')
     ORDER BY tablename`
  );

  return result.rows.map((row) => row.tablename);
}

const client = createPgClient();

try {
  await client.connect();

  const tables = await listPublicTables(client);

  if (tables.length === 0) {
    console.log('No application tables found in public schema.');
    process.exit(0);
  }

  console.log('Tables to reset:');
  for (const table of tables) {
    console.log(`  - ${table}`);
  }

  if (dryRun) {
    console.log('\nDry run only — no rows deleted.');
    process.exit(0);
  }

  if (!confirmed) {
    console.error(
      '\nRefusing to reset without confirmation.\n' +
        'Re-run with --confirm or set DB_RESET_CONFIRM=1.\n' +
        'Use --dry-run to preview tables only.'
    );
    process.exit(1);
  }

  if (requiresProductionOverride() && process.env.DB_RESET_ALLOW_PRODUCTION !== '1') {
    console.error(
      '\nRefusing to reset while NODE_ENV=production.\n' +
        'Set DB_RESET_ALLOW_PRODUCTION=1 to override.'
    );
    process.exit(1);
  }

  const quoted = tables.map((table) => `"${table.replace(/"/g, '""')}"`).join(', ');

  await client.query('BEGIN');
  await client.query(`TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE`);
  await client.query('COMMIT');

  console.log(`\nReset complete. Truncated ${tables.length} table(s).`);
} catch (error) {
  try {
    await client.query('ROLLBACK');
  } catch {
    // ignore rollback errors
  }

  console.error('Database reset failed:', error instanceof Error ? error.message : error);
  process.exit(1);
} finally {
  await client.end();
}

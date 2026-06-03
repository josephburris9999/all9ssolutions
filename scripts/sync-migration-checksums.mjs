/**
 * Reconcile _prisma_migrations.checksum with on-disk migration.sql files.
 * Use when migrations were edited after apply (Prisma "modified after applied" error).
 *
 * Usage: node scripts/sync-migration-checksums.mjs
 */
import 'dotenv/config';
import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const migrationsDir = path.join(root, 'prisma', 'migrations');

function checksum(content) {
  return createHash('sha256').update(content).digest('hex');
}

async function loadMigrationChecksums() {
  const entries = await readdir(migrationsDir, { withFileTypes: true });
  const map = new Map();

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const sqlPath = path.join(migrationsDir, entry.name, 'migration.sql');
    try {
      const content = await readFile(sqlPath, 'utf8');
      map.set(entry.name, checksum(content));
    } catch {
      // skip folders without migration.sql
    }
  }

  return map;
}

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  console.error('Set DATABASE_URL or DIRECT_URL');
  process.exit(1);
}

const local = await loadMigrationChecksums();
const client = new pg.Client({ connectionString });
await client.connect();

const { rows } = await client.query(
  'SELECT migration_name, checksum FROM "_prisma_migrations" ORDER BY finished_at'
);

let updated = 0;
for (const row of rows) {
  const next = local.get(row.migration_name);
  if (!next) continue;
  if (row.checksum === next) continue;

  await client.query(
    'UPDATE "_prisma_migrations" SET checksum = $1 WHERE migration_name = $2',
    [next, row.migration_name]
  );
  console.log(`updated checksum: ${row.migration_name}`);
  updated += 1;
}

await client.end();
console.log(updated === 0 ? 'All checksums already in sync.' : `Updated ${updated} checksum(s).`);

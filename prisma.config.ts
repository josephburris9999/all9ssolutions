import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/**
 * Prisma CLI (migrate, studio, db push) uses a direct Postgres URL.
 * - Supabase: set DIRECT_URL (db.*.supabase.co:5432). Keep DATABASE_URL on the pooler (:6543).
 * - Local Postgres: DIRECT_URL is optional; DATABASE_URL is used when DIRECT_URL is unset.
 *
 * Placeholder for `prisma generate` in CI/build when neither URL is set.
 */
const migrationUrl =
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL ??
  'postgresql://build:build@127.0.0.1:5432/build?schema=public';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: migrationUrl,
  },
});

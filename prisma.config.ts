import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/**
 * Placeholder for `prisma generate` in CI/build (e.g. Render) when DATABASE_URL is not set.
 * Runtime and migrations require a real DATABASE_URL in the environment.
 */
const databaseUrl =
  process.env.DATABASE_URL ??
  'postgresql://build:build@127.0.0.1:5432/build?schema=public';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: databaseUrl,
  },
});

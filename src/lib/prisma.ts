import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '@/generated/prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: Pool | undefined;
};

const BUILD_DATABASE_URL = 'postgresql://build:build@127.0.0.1:5432/build?schema=public';

function getDatabaseUrl(): string {
  const connectionString = process.env.DATABASE_URL;
  if (connectionString) return connectionString;
  if (process.env.NEXT_PHASE === 'phase-production-build') return BUILD_DATABASE_URL;
  throw new Error('DATABASE_URL is not set');
}

function pgSslRejectUnauthorized(): boolean {
  if (process.env.PG_SSL_REJECT_UNAUTHORIZED === 'true') return true;
  if (process.env.PG_SSL_REJECT_UNAUTHORIZED === 'false') return false;
  return process.env.NODE_ENV === 'production';
}

function usesRemoteSsl(connectionString: string): boolean {
  return (
    connectionString.includes('supabase.com') ||
    connectionString.includes('supabase.co') ||
    /sslmode=(require|verify-full|prefer)/.test(connectionString)
  );
}

function createPrismaClient() {
  const connectionString = getDatabaseUrl();

  const pool =
    globalForPrisma.pgPool ??
    new Pool({
      connectionString,
      ...(usesRemoteSsl(connectionString) && {
        ssl: { rejectUnauthorized: pgSslRejectUnauthorized() },
      }),
    });
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.pgPool = pool;
  }

  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

import pg from 'pg';
import { getDatabaseUrl } from './portal-password.mjs';

function pgSslRejectUnauthorized() {
  return process.env.PG_SSL_REJECT_UNAUTHORIZED === 'true';
}

function usesRemoteSsl(connectionString) {
  return (
    connectionString.includes('supabase.com') ||
    connectionString.includes('supabase.co') ||
    /sslmode=(require|verify-full|prefer)/.test(connectionString)
  );
}

/**
 * pg v8 treats sslmode=require as verify-full unless uselibpqcompat=true is set.
 * Normalize URLs so CLI scripts connect on WSL (see src/lib/prisma.ts).
 */
function normalizeConnectionString(connectionString) {
  if (!usesRemoteSsl(connectionString)) {
    return { connectionString, ssl: undefined };
  }

  try {
    const url = new URL(connectionString.replace(/^postgres:\/\//, 'postgresql://'));
    url.searchParams.set('uselibpqcompat', 'true');
    url.searchParams.set('sslmode', 'require');
    const normalized = url.toString().replace(/^postgresql:\/\//, 'postgres://');
    return {
      connectionString: normalized,
      ssl: { rejectUnauthorized: pgSslRejectUnauthorized() },
    };
  } catch {
    return {
      connectionString,
      ssl: { rejectUnauthorized: pgSslRejectUnauthorized() },
    };
  }
}

/** pg.Client configured for Supabase / remote TLS. */
export function createPgClient(connectionString = getDatabaseUrl()) {
  if (!connectionString) {
    throw new Error('DIRECT_URL or DATABASE_URL is required');
  }

  const { connectionString: url, ssl } = normalizeConnectionString(connectionString);

  return new pg.Client({
    connectionString: url,
    ...(ssl && { ssl }),
  });
}

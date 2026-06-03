# Prisma

This project uses [Prisma ORM v7](https://www.prisma.io/) with **PostgreSQL**.

## Requirements

- **Node.js 20.19+** (Prisma 7 does not support Node 18)
- **PostgreSQL** running locally or remotely
- Run commands from the project root with `.env` present

## Security audits

Do **not** run `npm audit fix --force` on this project: it can downgrade Prisma to v6 and break the Prisma 7 setup.

- **Next.js / PostCSS:** keep `next` on the latest 15.5.x patch; `package.json` `overrides` force `postcss@8.5.10` (including Next’s nested copy).
- **Prisma CLI (`@hono/node-server`):** dev-only; `package.json` `overrides` pins `@hono/node-server` to `>=1.19.13`. This does not affect the production app bundle.

## Setup

### Option A — Local PostgreSQL (no Docker)

1. Install and start PostgreSQL on Ubuntu/WSL:

   ```bash
   sudo apt update
   sudo apt install -y postgresql postgresql-contrib
   sudo service postgresql start
   ```

2. Create the role and database to match `.env`:

   ```bash
   sudo -u postgres psql <<'SQL'
   CREATE USER "user" WITH PASSWORD 'all9s_dev_password' CREATEDB;
   CREATE DATABASE all9ssolutions OWNER "user";
   GRANT ALL PRIVILEGES ON DATABASE all9ssolutions TO "user";
   SQL
   ```

   If the role or database already exists, reset the password:

   ```bash
   sudo -u postgres psql -c "ALTER USER \"user\" WITH PASSWORD 'all9s_dev_password';"
   ```

3. Test login:

   ```bash
   PGPASSWORD=all9s_dev_password psql -h localhost -U user -d all9ssolutions -c "SELECT 1;"
   ```

4. Migrate:

   ```bash
   npm run db:migrate
   ```

Default URL:

```env
DATABASE_URL="postgresql://user:all9s_dev_password@localhost:5432/all9ssolutions?schema=public"
```

### Option C — Supabase

Use two URLs:

| Variable | Used by | Connection |
|----------|---------|------------|
| `DATABASE_URL` | App (`src/lib/prisma.ts`) | Pooler, port **6543**, `?pgbouncer=true` |
| `DIRECT_URL` | Prisma CLI (`prisma.config.ts`) | **Session** pooler, port **5432** (same host as above, no `pgbouncer=true`) |

Copy connection strings from **Supabase → Project Settings → Database**.

```env
DATABASE_URL="postgres://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"
DIRECT_URL="postgres://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres?sslmode=require"
```

**P1001 on `db.[project-ref].supabase.co`:** The direct database host is often **IPv6-only**. WSL/Windows and many networks cannot reach it, which produces “Can't reach database server”. Use the **session pooler** URL on port **5432** for `DIRECT_URL` instead (as above). If you enable Supabase’s IPv4 add-on, `db.*.supabase.co` may work with user `postgres`.

Then migrate:

```bash
npm run db:migrate
```

Production deploy (and **Supabase** when `migrate dev` fails on the shadow database):

```bash
npm run db:migrate:deploy
```

(`prisma.config.ts` reads `DIRECT_URL` automatically; you do not pass `DATABASE_URL` on the command line.)

### Row Level Security (Supabase)

Migration `20260527120000_enable_rls` turns on RLS for all `public` app tables with **no** `anon`/`authenticated` policies, so the Supabase Data API cannot access them. Prisma (postgres role) is unaffected. `_prisma_migrations` is intentionally excluded (it is not present in Prisma’s shadow DB during `migrate dev`).

### Option B — Docker (optional)

Requires Docker installed (`sudo apt install -y docker.io` and WSL integration, or Docker Desktop).

```bash
cp .env.example .env
docker compose up -d
npm run db:migrate
```

### P1000: Authentication failed

Prisma reached PostgreSQL, but the **username or password in `DATABASE_URL` is wrong**, or that role does not exist. Fix `.env` or create the matching PostgreSQL role (Option A or B above).

If you previously used SQLite, use a fresh Postgres database or `npx prisma migrate reset` on a disposable dev DB.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run db:generate` | Regenerate Prisma Client after schema changes |
| `npm run db:migrate` | Create/apply migrations, then generate client |
| `npm run db:push` | Push schema to DB, then generate client |
| `npm run db:studio` | Open Prisma Studio |

## Usage

Import the shared client (safe for Next.js hot reload):

```ts
import { prisma } from '@/lib/prisma';

const requests = await prisma.consultationRequest.findMany();
```

## Configuration (Prisma 7)

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Models (`provider = "postgresql"`) |
| `prisma.config.ts` | `DIRECT_URL` for CLI (migrate, studio); falls back to `DATABASE_URL` locally |
| `src/lib/prisma.ts` | App client with `@prisma/adapter-pg` and `pg` connection pool |

Generated client output: `src/generated/prisma/` (created by `prisma generate`).

## Schema

`ConsultationRequest` mirrors the consultation form fields. String columns use PostgreSQL `VARCHAR` (see `@db.VarChar` in `prisma/schema.prisma`):

| Column | Max length |
|--------|------------|
| id | 30 |
| name | 200 |
| email | 254 |
| phone | 30 |
| timezone | 100 |
| preferredContact | 1 (`e` or `p`) |
| company | 200 |
| message | 10000 |

After schema changes:

```bash
npm run db:migrate
npm run db:generate
```

Wire the form to Prisma via a Next.js API route when you are ready to persist submissions instead of (or in addition to) the PHP mail handler.

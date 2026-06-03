# Deploying on Render

## Build

The build runs `npm install` (which runs `prisma generate`) and `npm run build`. **`DATABASE_URL` is not required at build time** — `prisma.config.ts` uses a placeholder URL for client generation only.

## Runtime (required)

Add **`DATABASE_URL`** to your Render web service environment variables. Use the **Internal Database URL** from your Render PostgreSQL instance (or another hosted Postgres URL).

Example:

```env
DATABASE_URL=postgresql://user:password@hostname:5432/all9ssolutions?schema=public
```

Without this, the consultation API cannot save submissions.

## Migrations

Apply schema to production once (from your machine or a one-off Render shell). With Supabase, set **`DIRECT_URL`** in `.env` (see `docs/prisma.md`); `prisma.config.ts` uses it for the CLI:

```bash
npx prisma migrate deploy
```

Or use `npm run db:push` only for disposable dev databases — prefer `migrate deploy` in production.

## Node version

`package.json` requires Node `>=20.19.0`. Render will pick a compatible version automatically.

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

Also set Resend variables for consultation confirmation emails and bounce/delivery webhooks:

```env
RESEND_API_KEY=re_...
CONSULTATION_CONFIRMATION_FROM="all9s Solutions <hello@all9ssolutions.com>"
CONSULTATION_REPLY_TO=hello@all9ssolutions.com
RESEND_WEBHOOK_SECRET=whsec_...
```

Register the webhook URL `https://your-domain.com/api/webhooks/resend` in the Resend dashboard with events `email.bounced` and `email.delivered`. The signing secret must match `RESEND_WEBHOOK_SECRET`. See `docs/bot-protection.md` for details.

Set Stripe variables for client portal payments:

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CHECKOUT_CURRENCY=usd
PORTAL_APP_URL=https://all9ssolutions.com
```

Register the webhook URL `https://your-domain.com/api/webhooks/stripe` in the Stripe dashboard with the event `checkout.session.completed`. The signing secret must match `STRIPE_WEBHOOK_SECRET`.

## Migrations

Apply schema to production once (from your machine or a one-off Render shell). With Supabase, set **`DIRECT_URL`** in `.env` (see `docs/prisma.md`); `prisma.config.ts` uses it for the CLI:

```bash
npx prisma migrate deploy
```

Or use `npm run db:push` only for disposable dev databases — prefer `migrate deploy` in production.

## Node version

`package.json` requires Node `>=20.19.0`. Render will pick a compatible version automatically.

# Portal migration drift (Supabase)

Do **not** run `prisma migrate reset` on the shared Supabase database unless you accept losing all portal and consultation data.

## Why `npm run db:migrate` fails

1. **Missing migration files** — migrations applied on Supabase but removed locally (e.g. `20260606120000_portal_content_upload`).
2. **Edited migrations** — SQL files changed after apply; Prisma checksums in `_prisma_migrations` no longer match disk.
3. **Pending migrations** — e.g. `20260609120000_portal_agreement_table` (creates `ClientAgreement`) not yet applied.

## Safe recovery (recommended order)

From the project root with `DATABASE_URL` and `DIRECT_URL` set:

```bash
# 1. Align checksums for migrations edited after apply
node scripts/sync-migration-checksums.mjs

# 2. Apply pending migrations (no reset)
npx prisma migrate deploy

# 3. Regenerate client
npx prisma generate
```

If step 2 reports drift but deploy succeeds, run `npx prisma migrate status` to confirm.

## If a new table exists only in schema (not yet on Supabase)

Use push + resolve instead of reset:

```bash
npx prisma db push
npx prisma generate
npx prisma migrate resolve --applied <migration_folder_name>
```

Example for content uploads (only if the table is missing on Supabase):

```bash
npx prisma migrate resolve --applied 20260606120000_portal_content_upload
```

## Apply consultation-required project links manually

If `20260606124500_project_consultation_required` is not recorded as applied:

```bash
npx prisma db execute --file prisma/migrations/20260606124500_project_consultation_required/migration.sql --schema prisma/schema.prisma
npx prisma migrate resolve --applied 20260606124500_project_consultation_required
npx prisma generate
```

The SQL backfills null `consultationRequestId` values and fails with a clear error if any project cannot be linked.

## Apply client agreement table manually

If `20260609120000_portal_agreement_table` fails via deploy:

```bash
npx prisma db execute --file prisma/migrations/20260609120000_portal_agreement_table/migration.sql --schema prisma/schema.prisma
npx prisma migrate resolve --applied 20260609120000_portal_agreement_table
npx prisma generate
```

If the database still has a `PortalAgreement` table from an earlier apply of that migration:

```bash
npx prisma db execute --file prisma/migrations/20260610120000_rename_portal_agreement_to_client_agreement/migration.sql --schema prisma/schema.prisma
npx prisma migrate resolve --applied 20260610120000_rename_portal_agreement_to_client_agreement
npx prisma generate
```

## Migrations known to have been edited after apply

These are safe to keep on disk; run `sync-migration-checksums.mjs` after edits:

- `20260527120000_enable_rls`
- `20260603120000_project`
- `20260605120000_project_amount_due`
- `20260607130000_generated_primary_keys`

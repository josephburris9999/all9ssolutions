# Portal document uploads (Supabase Storage)

Client portal uploads are stored in **Supabase Storage**. Metadata (file name, size, MIME type, storage path) is saved in the `PortalContentUpload` Postgres table via Prisma.

## 1. Create a private bucket

In the Supabase dashboard: **Storage → New bucket**

| Setting | Value |
|--------|--------|
| Name | `portal-uploads` (or set `PORTAL_UPLOAD_BUCKET` in `.env`) |
| Public | **Off** (private) |

The Next.js API uploads with the **service role** key. Keep the bucket **private** so objects are not world-readable. Do not add public read policies.

## Access control

Files are never exposed via public Storage URLs. Downloads go through authenticated API routes only:

| Who | How |
|-----|-----|
| **Client** | `GET /api/portal/content-uploads/{id}/download` — session must be a client account; upload must belong to that `portalUserId`. |
| **Administrator** | `GET /api/portal/admin/consultations/{consultationId}/content-uploads/{uploadId}/download` — admin session; upload must belong to that consultation’s linked portal user. |

List/upload client APIs (`/api/portal/content-uploads`) reject admin sessions so admins cannot read another client’s files through the client endpoints.

Metadata in `PortalContentUpload` has RLS enabled with no anon policies (same as other portal tables).

## 2. Environment variables

Add to `.env` (server-only keys must not use `NEXT_PUBLIC_`):

```bash
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
# Optional — defaults to portal-uploads
# PORTAL_UPLOAD_BUCKET="portal-uploads"
```

`NEXT_PUBLIC_SUPABASE_ANON_KEY` is still used for Realtime on Messages; uploads do not use the anon key.

## 3. Database table

Ensure migration `20260606120000_portal_content_upload` is applied:

```bash
npm run db:migrate:deploy
```

## 4. Object layout

Files are stored at:

```text
{portalUserId}/{uuid}-{sanitizedFileName}
```

Example: `cmpvb2gzt506cf49949c0bfc5/a1b2c3d4-4e5f-6789-brief.pdf`

## 5. Limits

- 25 MB per file
- 10 files per request
- Allowed: PDF, Word, text/markdown, common images, ZIP

Configured in `src/lib/portal-content-upload-constants.ts`.

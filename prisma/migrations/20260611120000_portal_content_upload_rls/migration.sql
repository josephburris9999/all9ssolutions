-- Portal uploads: metadata in Postgres; blobs in Supabase Storage (app uses service role).
ALTER TABLE "PortalContentUpload" ENABLE ROW LEVEL SECURITY;

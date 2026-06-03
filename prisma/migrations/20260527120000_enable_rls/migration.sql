-- Enable RLS on public tables exposed to Supabase Data API.
-- No policies are added: anon/authenticated cannot read or write these rows.
-- The app's Prisma connection uses the postgres role and bypasses RLS.

ALTER TABLE "ConsultationRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PortalUser" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Progress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProgressMessage" ENABLE ROW LEVEL SECURITY;

-- Database-generated primary keys for all application tables.
-- Uses gen_random_uuid() (available on Supabase without CREATE EXTENSION).

CREATE OR REPLACE FUNCTION generate_portal_id()
RETURNS varchar(30)
LANGUAGE sql
VOLATILE
SET search_path = public
AS $$
  SELECT substr(replace(gen_random_uuid()::text, '-', ''), 1, 30)::varchar(30);
$$;

ALTER TABLE "ConsultationRequest" ALTER COLUMN "id" SET DEFAULT generate_portal_id();
ALTER TABLE "PortalUser" ALTER COLUMN "id" SET DEFAULT generate_portal_id();
ALTER TABLE "Project" ALTER COLUMN "id" SET DEFAULT generate_portal_id();
ALTER TABLE "Progress" ALTER COLUMN "id" SET DEFAULT generate_portal_id();
ALTER TABLE "ProgressMessage" ALTER COLUMN "id" SET DEFAULT generate_portal_id();

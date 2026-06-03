-- Admin nav badge counts no longer use Supabase Realtime.
-- Keep ProgressMessage in supabase_realtime for portal support messages.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'ConsultationRequest'
    ) THEN
      ALTER PUBLICATION supabase_realtime DROP TABLE "ConsultationRequest";
    END IF;

    IF EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'Project'
    ) THEN
      ALTER PUBLICATION supabase_realtime DROP TABLE "Project";
    END IF;
  END IF;
END $$;

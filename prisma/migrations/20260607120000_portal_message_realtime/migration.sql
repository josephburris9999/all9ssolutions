-- Supabase Realtime: stream new ProgressMessage rows to the portal Messages section.
-- Safe on local Postgres: skips publication/policy when Supabase roles are absent.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'ProgressMessage'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE "ProgressMessage";
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
     AND NOT EXISTS (
       SELECT 1
       FROM pg_policies
       WHERE schemaname = 'public'
         AND tablename = 'ProgressMessage'
         AND policyname = 'realtime_select_progress_message'
     ) THEN
    CREATE POLICY "realtime_select_progress_message"
      ON "ProgressMessage"
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END $$;

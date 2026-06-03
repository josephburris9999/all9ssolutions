-- Supabase Realtime: refresh admin client category badges when consultations or projects change.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'ConsultationRequest'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE "ConsultationRequest";
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'Project'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE "Project";
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
         AND tablename = 'ConsultationRequest'
         AND policyname = 'realtime_select_consultation_request'
     ) THEN
    CREATE POLICY "realtime_select_consultation_request"
      ON "ConsultationRequest"
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
     AND NOT EXISTS (
       SELECT 1
       FROM pg_policies
       WHERE schemaname = 'public'
         AND tablename = 'Project'
         AND policyname = 'realtime_select_project'
     ) THEN
    CREATE POLICY "realtime_select_project"
      ON "Project"
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END $$;

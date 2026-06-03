-- Backfill plan + enforcement for: Project.consultationRequestId required.
-- This script:
-- 1) Backfills NULL consultationRequestId using best-match ConsultationRequest per portal user
-- 2) Fails hard if any NULLs remain (manual fix required)
-- 3) Enforces NOT NULL and FK ON DELETE RESTRICT

-- Step 1: best-effort backfill for existing NULL project links.
-- Strategy per project:
--   - Prefer latest consultation for same portal user created at/before project.createdAt
--   - Else fallback to latest consultation for same portal user
WITH candidate_links AS (
  SELECT
    p."id" AS project_id,
    COALESCE(
      (
        SELECT c."id"
        FROM "ConsultationRequest" c
        WHERE c."portalUserId" = p."portalUserId"
          AND c."createdAt" <= p."createdAt"
        ORDER BY c."createdAt" DESC
        LIMIT 1
      ),
      (
        SELECT c2."id"
        FROM "ConsultationRequest" c2
        WHERE c2."portalUserId" = p."portalUserId"
        ORDER BY c2."createdAt" DESC
        LIMIT 1
      )
    ) AS consultation_id
  FROM "Project" p
  WHERE p."consultationRequestId" IS NULL
)
UPDATE "Project" p
SET "consultationRequestId" = cl.consultation_id
FROM candidate_links cl
WHERE p."id" = cl.project_id
  AND cl.consultation_id IS NOT NULL;

-- Step 2: abort if any projects still cannot be linked.
DO $$
DECLARE
  remaining_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_count
  FROM "Project"
  WHERE "consultationRequestId" IS NULL;

  IF remaining_count > 0 THEN
    RAISE EXCEPTION
      'Backfill incomplete: % project row(s) still have NULL consultationRequestId. Manually link these rows before applying NOT NULL.',
      remaining_count;
  END IF;
END $$;

-- Step 3: enforce required relationship and delete behavior.
ALTER TABLE "Project"
  ALTER COLUMN "consultationRequestId" SET NOT NULL;

ALTER TABLE "Project"
  DROP CONSTRAINT IF EXISTS "Project_consultationRequestId_fkey";

ALTER TABLE "Project"
  ADD CONSTRAINT "Project_consultationRequestId_fkey"
  FOREIGN KEY ("consultationRequestId")
  REFERENCES "ConsultationRequest"("id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

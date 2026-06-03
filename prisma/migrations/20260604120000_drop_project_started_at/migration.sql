-- Timeline start comes from ConsultationRequest.createdAt
DROP INDEX IF EXISTS "Project_startedAt_idx";
ALTER TABLE "Project" DROP COLUMN IF EXISTS "startedAt";

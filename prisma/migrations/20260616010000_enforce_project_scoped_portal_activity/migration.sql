-- Enforce project-scoped portal activity.
-- PortalContentUpload and Progress must always belong to a Project.

-- Remove non-project-scoped legacy rows first.
DELETE FROM "PortalContentUpload" WHERE "projectId" IS NULL;
DELETE FROM "Progress" WHERE "projectId" IS NULL;

-- PortalContentUpload: require projectId and drop redundant portalUserId.
ALTER TABLE "PortalContentUpload"
  ALTER COLUMN "projectId" SET NOT NULL;

DROP INDEX IF EXISTS "PortalContentUpload_portalUserId_idx";
DROP INDEX IF EXISTS "PortalContentUpload_portalUserId_createdAt_idx";
DROP INDEX IF EXISTS "PortalContentUpload_portalUserId_projectId_idx";

ALTER TABLE "PortalContentUpload" DROP CONSTRAINT IF EXISTS "PortalContentUpload_portalUserId_fkey";
ALTER TABLE "PortalContentUpload" DROP COLUMN "portalUserId";

CREATE INDEX "PortalContentUpload_projectId_idx" ON "PortalContentUpload"("projectId");
CREATE INDEX "PortalContentUpload_projectId_createdAt_idx" ON "PortalContentUpload"("projectId", "createdAt");

-- Progress: require projectId and drop redundant portalUserId.
ALTER TABLE "Progress"
  ALTER COLUMN "projectId" SET NOT NULL;

DROP INDEX IF EXISTS "Progress_portalUserId_idx";
DROP INDEX IF EXISTS "Progress_portalUserId_projectId_idx";

ALTER TABLE "Progress" DROP CONSTRAINT IF EXISTS "Progress_portalUserId_fkey";
ALTER TABLE "Progress" DROP COLUMN "portalUserId";

CREATE INDEX "Progress_projectId_idx" ON "Progress"("projectId");

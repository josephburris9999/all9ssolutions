-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PLANNED', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Project" (
    "id" VARCHAR(30) NOT NULL,
    "portalUserId" VARCHAR(30) NOT NULL,
    "consultationRequestId" VARCHAR(30),
    "title" VARCHAR(200) NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "estimatedCompletionAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Project_consultationRequestId_key" ON "Project"("consultationRequestId");
CREATE INDEX "Project_portalUserId_idx" ON "Project"("portalUserId");
CREATE INDEX "Project_portalUserId_status_idx" ON "Project"("portalUserId", "status");
CREATE INDEX "Project_estimatedCompletionAt_idx" ON "Project"("estimatedCompletionAt");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_portalUserId_fkey" FOREIGN KEY ("portalUserId") REFERENCES "PortalUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Project" ADD CONSTRAINT "Project_consultationRequestId_fkey" FOREIGN KEY ("consultationRequestId") REFERENCES "ConsultationRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Migrate legacy estimatedCompletionAt on PortalUser into Project rows
INSERT INTO "Project" (
    "id",
    "portalUserId",
    "consultationRequestId",
    "title",
    "status",
    "estimatedCompletionAt",
    "createdAt",
    "updatedAt"
)
SELECT
    'p' || substr(md5(pu."id" || coalesce(pu."estimatedCompletionAt"::text, '')), 1, 29),
    pu."id",
    (
        SELECT cr."id"
        FROM "ConsultationRequest" cr
        WHERE cr."portalUserId" = pu."id"
        ORDER BY cr."createdAt" ASC
        LIMIT 1
    ),
    'Primary project',
    'ACTIVE',
    pu."estimatedCompletionAt",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "PortalUser" pu
WHERE pu."estimatedCompletionAt" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "Project" p WHERE p."portalUserId" = pu."id");

-- DropColumn
ALTER TABLE "PortalUser" DROP COLUMN IF EXISTS "estimatedCompletionAt";

-- RLS
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;

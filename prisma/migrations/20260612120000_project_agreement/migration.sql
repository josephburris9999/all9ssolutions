-- CreateEnum
CREATE TYPE "ProjectAgreementStatus" AS ENUM ('PENDING', 'SIGNED');

-- CreateTable
CREATE TABLE "ProjectAgreement" (
    "id" VARCHAR(30) NOT NULL,
    "projectId" VARCHAR(30) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "documentVersion" VARCHAR(20) NOT NULL,
    "status" "ProjectAgreementStatus" NOT NULL DEFAULT 'PENDING',
    "signerName" VARCHAR(200),
    "signedAt" TIMESTAMPTZ(3),
    "signedTimeZone" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectAgreement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectAgreement_projectId_idx" ON "ProjectAgreement"("projectId");

-- CreateIndex
CREATE INDEX "ProjectAgreement_projectId_status_idx" ON "ProjectAgreement"("projectId", "status");

-- CreateIndex
CREATE INDEX "ProjectAgreement_createdAt_idx" ON "ProjectAgreement"("createdAt");

-- AddForeignKey
ALTER TABLE "ProjectAgreement" ADD CONSTRAINT "ProjectAgreement_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProjectAgreement" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "ProjectAgreement" ALTER COLUMN "id" SET DEFAULT generate_portal_id();

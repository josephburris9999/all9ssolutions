-- CreateEnum
CREATE TYPE "PendingAgreementStatus" AS ENUM ('PENDING', 'APPROVED');

-- CreateTable
CREATE TABLE "PendingAgreement" (
    "id" VARCHAR(30) NOT NULL,
    "consultationRequestId" VARCHAR(30) NOT NULL,
    "status" "PendingAgreementStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PendingAgreement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PendingAgreement_consultationRequestId_key" ON "PendingAgreement"("consultationRequestId");

-- CreateIndex
CREATE INDEX "PendingAgreement_consultationRequestId_idx" ON "PendingAgreement"("consultationRequestId");

-- CreateIndex
CREATE INDEX "PendingAgreement_status_idx" ON "PendingAgreement"("status");

-- CreateIndex
CREATE INDEX "PendingAgreement_createdAt_idx" ON "PendingAgreement"("createdAt");

-- AddForeignKey
ALTER TABLE "PendingAgreement" ADD CONSTRAINT "PendingAgreement_consultationRequestId_fkey" FOREIGN KEY ("consultationRequestId") REFERENCES "ConsultationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PendingAgreement" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "PendingAgreement" ALTER COLUMN "id" SET DEFAULT generate_portal_id();

-- Backfill pending agreements for consultations with unsigned project agreements.
INSERT INTO "PendingAgreement" ("id", "consultationRequestId", "status", "createdAt", "updatedAt")
SELECT generate_portal_id(), p."consultationRequestId", 'PENDING', NOW(), NOW()
FROM "Project" p
INNER JOIN "ProjectAgreement" pa ON pa."projectId" = p."id"
WHERE pa."status" = 'PENDING'
ON CONFLICT ("consultationRequestId") DO NOTHING;

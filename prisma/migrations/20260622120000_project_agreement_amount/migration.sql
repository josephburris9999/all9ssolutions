-- AlterTable
ALTER TABLE "ProjectAgreement" ADD COLUMN "amount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Migrate amounts from line items (sum per project) onto the earliest agreement per project.
UPDATE "ProjectAgreement" pa
SET "amount" = COALESCE(
  (
    SELECT SUM(padi."amount")
    FROM "ProjectAmountDueItem" padi
    WHERE padi."projectId" = pa."projectId"
  ),
  0
);

-- DropTable
DROP TABLE "ProjectAmountDueItem";

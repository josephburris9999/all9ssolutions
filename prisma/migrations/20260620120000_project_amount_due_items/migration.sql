-- Line-item amounts due per project (deposit and paid remain on Project).

CREATE TABLE "ProjectAmountDueItem" (
  "id" VARCHAR(30) NOT NULL DEFAULT generate_portal_id(),
  "projectId" VARCHAR(30) NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "description" VARCHAR(255) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProjectAmountDueItem_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ProjectAmountDueItem"
  ADD CONSTRAINT "ProjectAmountDueItem_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "ProjectAmountDueItem_projectId_idx" ON "ProjectAmountDueItem"("projectId");
CREATE INDEX "ProjectAmountDueItem_projectId_createdAt_idx" ON "ProjectAmountDueItem"("projectId", "createdAt");

-- Move legacy single Project.amountDue values into one line item per project.
INSERT INTO "ProjectAmountDueItem" ("projectId", "amount", "description")
SELECT id, "amountDue", 'Amount due'
FROM "Project"
WHERE COALESCE("amountDue", 0) > 0;

ALTER TABLE "ProjectAmountDueItem" ENABLE ROW LEVEL SECURITY;

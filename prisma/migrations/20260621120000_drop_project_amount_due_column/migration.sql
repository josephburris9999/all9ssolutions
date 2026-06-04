-- Amount due is stored on ProjectAmountDueItem; drop legacy Project.amountDue.

ALTER TABLE "Project" DROP COLUMN IF EXISTS "amountDue";

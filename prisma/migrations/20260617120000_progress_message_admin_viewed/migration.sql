-- AlterTable
ALTER TABLE "ProgressMessage" ADD COLUMN "adminViewedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "ProgressMessage_kind_adminViewedAt_idx" ON "ProgressMessage"("kind", "adminViewedAt");

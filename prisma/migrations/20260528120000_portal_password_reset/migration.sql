-- AlterTable
ALTER TABLE "PortalUser" ADD COLUMN "passwordResetTokenHash" VARCHAR(64),
ADD COLUMN "passwordResetExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "PortalUser_passwordResetTokenHash_idx" ON "PortalUser"("passwordResetTokenHash");

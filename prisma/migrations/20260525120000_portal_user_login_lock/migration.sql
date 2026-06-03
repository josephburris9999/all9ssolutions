-- AlterTable
ALTER TABLE "PortalUser" ADD COLUMN "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "PortalUser" ADD COLUMN "lockedAt" TIMESTAMP(3);

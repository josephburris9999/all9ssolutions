-- CreateEnum
CREATE TYPE "ProgressStatus" AS ENUM ('OPEN', 'AWAITING_PROVIDER', 'AWAITING_CLIENT', 'CLOSED');

-- CreateEnum
CREATE TYPE "ProgressMessageKind" AS ENUM ('REQUEST', 'ANSWER');

-- CreateTable
CREATE TABLE "Progress" (
    "id" VARCHAR(30) NOT NULL,
    "portalUserId" VARCHAR(30) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "status" "ProgressStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgressMessage" (
    "id" VARCHAR(30) NOT NULL,
    "progressId" VARCHAR(30) NOT NULL,
    "kind" "ProgressMessageKind" NOT NULL,
    "body" VARCHAR(10000) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgressMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Progress_portalUserId_idx" ON "Progress"("portalUserId");

-- CreateIndex
CREATE INDEX "Progress_status_idx" ON "Progress"("status");

-- CreateIndex
CREATE INDEX "Progress_createdAt_idx" ON "Progress"("createdAt");

-- CreateIndex
CREATE INDEX "ProgressMessage_progressId_idx" ON "ProgressMessage"("progressId");

-- CreateIndex
CREATE INDEX "ProgressMessage_progressId_createdAt_idx" ON "ProgressMessage"("progressId", "createdAt");

-- AddForeignKey
ALTER TABLE "Progress" ADD CONSTRAINT "Progress_portalUserId_fkey" FOREIGN KEY ("portalUserId") REFERENCES "PortalUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressMessage" ADD CONSTRAINT "ProgressMessage_progressId_fkey" FOREIGN KEY ("progressId") REFERENCES "Progress"("id") ON DELETE CASCADE ON UPDATE CASCADE;

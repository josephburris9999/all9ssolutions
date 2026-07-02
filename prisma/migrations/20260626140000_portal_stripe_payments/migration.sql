CREATE TYPE "PortalPaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

CREATE TABLE "PortalPayment" (
    "id" VARCHAR(36) NOT NULL,
    "projectId" VARCHAR(30) NOT NULL,
    "portalUserId" VARCHAR(30) NOT NULL,
    "stripeCheckoutSessionId" VARCHAR(255),
    "stripePaymentIntentId" VARCHAR(255),
    "stripeEventId" VARCHAR(255),
    "amountCents" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'usd',
    "status" "PortalPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMPTZ(3),

    CONSTRAINT "PortalPayment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PortalPayment_stripeCheckoutSessionId_key" ON "PortalPayment"("stripeCheckoutSessionId");
CREATE UNIQUE INDEX "PortalPayment_stripeEventId_key" ON "PortalPayment"("stripeEventId");
CREATE INDEX "PortalPayment_projectId_idx" ON "PortalPayment"("projectId");
CREATE INDEX "PortalPayment_portalUserId_idx" ON "PortalPayment"("portalUserId");
CREATE INDEX "PortalPayment_status_idx" ON "PortalPayment"("status");
CREATE INDEX "PortalPayment_createdAt_idx" ON "PortalPayment"("createdAt");

ALTER TABLE "PortalPayment"
  ADD CONSTRAINT "PortalPayment_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PortalPayment"
  ADD CONSTRAINT "PortalPayment_portalUserId_fkey"
  FOREIGN KEY ("portalUserId") REFERENCES "PortalUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

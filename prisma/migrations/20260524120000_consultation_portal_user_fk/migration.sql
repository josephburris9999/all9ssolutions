-- AlterTable
ALTER TABLE "ConsultationRequest" ADD COLUMN "portalUserId" VARCHAR(30);

-- CreateIndex
CREATE INDEX "ConsultationRequest_portalUserId_idx" ON "ConsultationRequest"("portalUserId");

-- AddForeignKey
ALTER TABLE "ConsultationRequest" ADD CONSTRAINT "ConsultationRequest_portalUserId_fkey" FOREIGN KEY ("portalUserId") REFERENCES "PortalUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

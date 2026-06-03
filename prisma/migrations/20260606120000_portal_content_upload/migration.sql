-- CreateTable
CREATE TABLE "PortalContentUpload" (
    "id" VARCHAR(30) NOT NULL,
    "portalUserId" VARCHAR(30) NOT NULL,
    "fileName" VARCHAR(255) NOT NULL,
    "storageKey" VARCHAR(500) NOT NULL,
    "mimeType" VARCHAR(127) NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortalContentUpload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PortalContentUpload_portalUserId_idx" ON "PortalContentUpload"("portalUserId");

-- CreateIndex
CREATE INDEX "PortalContentUpload_portalUserId_createdAt_idx" ON "PortalContentUpload"("portalUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "PortalContentUpload" ADD CONSTRAINT "PortalContentUpload_portalUserId_fkey" FOREIGN KEY ("portalUserId") REFERENCES "PortalUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

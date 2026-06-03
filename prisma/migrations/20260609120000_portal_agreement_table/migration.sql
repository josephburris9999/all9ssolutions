-- CreateTable
CREATE TABLE "ClientAgreement" (
    "id" VARCHAR(30) NOT NULL,
    "portalUserId" VARCHAR(30) NOT NULL,
    "signerName" VARCHAR(200) NOT NULL,
    "signedAt" TIMESTAMPTZ(3) NOT NULL,
    "version" VARCHAR(20) NOT NULL,
    "signedTimeZone" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientAgreement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClientAgreement_portalUserId_key" ON "ClientAgreement"("portalUserId");

-- CreateIndex
CREATE INDEX "ClientAgreement_portalUserId_idx" ON "ClientAgreement"("portalUserId");

-- CreateIndex
CREATE INDEX "ClientAgreement_signedAt_idx" ON "ClientAgreement"("signedAt");

-- AddForeignKey
ALTER TABLE "ClientAgreement" ADD CONSTRAINT "ClientAgreement_portalUserId_fkey" FOREIGN KEY ("portalUserId") REFERENCES "PortalUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing signed agreements from PortalUser
INSERT INTO "ClientAgreement" (
    "id",
    "portalUserId",
    "signerName",
    "signedAt",
    "version",
    "signedTimeZone",
    "createdAt",
    "updatedAt"
)
SELECT
    generate_portal_id(),
    "id",
    "agreementSignerName",
    "agreementSignedAt",
    COALESCE("agreementVersion", '2026-05-31'),
    "agreementSignedTimeZone",
    COALESCE("agreementSignedAt", CURRENT_TIMESTAMP),
    CURRENT_TIMESTAMP
FROM "PortalUser"
WHERE "agreementSignedAt" IS NOT NULL
  AND "agreementSignerName" IS NOT NULL;

-- DropColumn
ALTER TABLE "PortalUser" DROP COLUMN "agreementSignedAt";

-- DropColumn
ALTER TABLE "PortalUser" DROP COLUMN "agreementSignerName";

-- DropColumn
ALTER TABLE "PortalUser" DROP COLUMN "agreementVersion";

-- DropColumn
ALTER TABLE "PortalUser" DROP COLUMN "agreementSignedTimeZone";

-- Match other portal tables: database-generated ids
ALTER TABLE "ClientAgreement" ALTER COLUMN "id" SET DEFAULT generate_portal_id();

-- Enable RLS (app uses postgres role; anon/authenticated have no policies)
ALTER TABLE "ClientAgreement" ENABLE ROW LEVEL SECURITY;

-- Portal client agreement signature
ALTER TABLE "PortalUser" ADD COLUMN "agreementSignedAt" TIMESTAMP(3);
ALTER TABLE "PortalUser" ADD COLUMN "agreementSignerName" VARCHAR(200);
ALTER TABLE "PortalUser" ADD COLUMN "agreementVersion" VARCHAR(20);

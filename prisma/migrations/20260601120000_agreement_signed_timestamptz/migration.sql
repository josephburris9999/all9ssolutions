-- Store agreement signature instant in UTC with timezone metadata
ALTER TABLE "PortalUser" ALTER COLUMN "agreementSignedAt" TYPE TIMESTAMPTZ(3) USING "agreementSignedAt" AT TIME ZONE 'UTC';
ALTER TABLE "PortalUser" ADD COLUMN IF NOT EXISTS "agreementSignedTimeZone" VARCHAR(100);

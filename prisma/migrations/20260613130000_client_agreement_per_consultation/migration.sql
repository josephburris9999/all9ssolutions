-- Client Service Agreement: one row per consultation (not per portal account).

ALTER TABLE "ClientAgreement" ADD COLUMN "consultationRequestId" VARCHAR(30);

UPDATE "ClientAgreement" ca
SET "consultationRequestId" = sub."consultationRequestId"
FROM (
  SELECT DISTINCT ON (ca2.id)
    ca2.id AS "agreementId",
    cr.id AS "consultationRequestId"
  FROM "ClientAgreement" ca2
  INNER JOIN "ConsultationRequest" cr ON cr."portalUserId" = ca2."portalUserId"
  ORDER BY ca2.id, cr."createdAt" ASC
) sub
WHERE ca.id = sub."agreementId";

UPDATE "ClientAgreement" ca
SET "consultationRequestId" = sub."consultationRequestId"
FROM (
  SELECT DISTINCT ON (ca2.id)
    ca2.id AS "agreementId",
    p."consultationRequestId" AS "consultationRequestId"
  FROM "ClientAgreement" ca2
  INNER JOIN "Project" p ON p."portalUserId" = ca2."portalUserId"
  WHERE ca2."consultationRequestId" IS NULL
  ORDER BY ca2.id, p."createdAt" ASC
) sub
WHERE ca.id = sub."agreementId"
  AND ca."consultationRequestId" IS NULL;

DELETE FROM "ClientAgreement" WHERE "consultationRequestId" IS NULL;

ALTER TABLE "ClientAgreement" ALTER COLUMN "consultationRequestId" SET NOT NULL;

DROP INDEX IF EXISTS "ClientAgreement_portalUserId_key";
DROP INDEX IF EXISTS "ClientAgreement_portalUserId_idx";

ALTER TABLE "ClientAgreement" DROP CONSTRAINT IF EXISTS "ClientAgreement_portalUserId_fkey";
ALTER TABLE "ClientAgreement" DROP COLUMN "portalUserId";

CREATE UNIQUE INDEX "ClientAgreement_consultationRequestId_key" ON "ClientAgreement"("consultationRequestId");
CREATE INDEX "ClientAgreement_consultationRequestId_idx" ON "ClientAgreement"("consultationRequestId");

ALTER TABLE "ClientAgreement"
  ADD CONSTRAINT "ClientAgreement_consultationRequestId_fkey"
  FOREIGN KEY ("consultationRequestId") REFERENCES "ConsultationRequest"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Rename PortalAgreement to ClientAgreement when the old table exists.
DO $$
BEGIN
  IF to_regclass('public."PortalAgreement"') IS NOT NULL THEN
    ALTER TABLE "PortalAgreement" RENAME TO "ClientAgreement";
    ALTER INDEX "PortalAgreement_pkey" RENAME TO "ClientAgreement_pkey";
    ALTER INDEX "PortalAgreement_portalUserId_key" RENAME TO "ClientAgreement_portalUserId_key";
    ALTER INDEX "PortalAgreement_portalUserId_idx" RENAME TO "ClientAgreement_portalUserId_idx";
    ALTER INDEX "PortalAgreement_signedAt_idx" RENAME TO "ClientAgreement_signedAt_idx";
    ALTER TABLE "ClientAgreement"
      RENAME CONSTRAINT "PortalAgreement_portalUserId_fkey" TO "ClientAgreement_portalUserId_fkey";
  END IF;
END $$;

-- Per-project agreement body (customized contract text).
ALTER TABLE "ProjectAgreement" ADD COLUMN "body" VARCHAR(20000) NOT NULL DEFAULT '';

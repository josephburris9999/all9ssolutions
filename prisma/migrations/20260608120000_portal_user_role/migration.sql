-- Portal user type: c = client (default)
ALTER TABLE "PortalUser" ADD COLUMN "role" VARCHAR(1) NOT NULL DEFAULT 'c';

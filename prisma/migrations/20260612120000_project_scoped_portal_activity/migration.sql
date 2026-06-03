-- Progress and content uploads scoped to a client project.

ALTER TABLE "Progress" ADD COLUMN "projectId" VARCHAR(30);

ALTER TABLE "PortalContentUpload" ADD COLUMN "projectId" VARCHAR(30);

ALTER TABLE "Progress"
  ADD CONSTRAINT "Progress_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PortalContentUpload"
  ADD CONSTRAINT "PortalContentUpload_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Progress_portalUserId_projectId_idx" ON "Progress"("portalUserId", "projectId");

CREATE INDEX "PortalContentUpload_portalUserId_projectId_idx" ON "PortalContentUpload"("portalUserId", "projectId");

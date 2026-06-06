-- CreateTable
CREATE TABLE "ConsultationDiscussion" (
    "id" VARCHAR(30) NOT NULL,
    "consultationRequestId" VARCHAR(30) NOT NULL,
    "body" VARCHAR(20000) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsultationDiscussion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConsultationDiscussion_consultationRequestId_key" ON "ConsultationDiscussion"("consultationRequestId");

-- CreateIndex
CREATE INDEX "ConsultationDiscussion_consultationRequestId_idx" ON "ConsultationDiscussion"("consultationRequestId");

-- AddForeignKey
ALTER TABLE "ConsultationDiscussion" ADD CONSTRAINT "ConsultationDiscussion_consultationRequestId_fkey" FOREIGN KEY ("consultationRequestId") REFERENCES "ConsultationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ConsultationDiscussion" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "ConsultationDiscussion" ALTER COLUMN "id" SET DEFAULT generate_portal_id();

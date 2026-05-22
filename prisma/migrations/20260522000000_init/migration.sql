-- CreateTable
CREATE TABLE "ConsultationRequest" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "phone" VARCHAR(30),
    "timezone" VARCHAR(100),
    "preferredContact" VARCHAR(1) NOT NULL,
    "company" VARCHAR(200),
    "message" VARCHAR(10000) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsultationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConsultationRequest_email_idx" ON "ConsultationRequest"("email");

-- CreateIndex
CREATE INDEX "ConsultationRequest_createdAt_idx" ON "ConsultationRequest"("createdAt");

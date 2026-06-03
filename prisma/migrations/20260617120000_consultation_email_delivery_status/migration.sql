-- Track Resend delivery outcomes for consultation confirmation emails.
ALTER TABLE "ConsultationRequest" ADD COLUMN "lastResendEmailId" VARCHAR(64);
ALTER TABLE "ConsultationRequest" ADD COLUMN "emailDeliveryStatus" VARCHAR(20);
ALTER TABLE "ConsultationRequest" ADD COLUMN "emailBouncedAt" TIMESTAMPTZ;

CREATE INDEX "ConsultationRequest_lastResendEmailId_idx" ON "ConsultationRequest"("lastResendEmailId");

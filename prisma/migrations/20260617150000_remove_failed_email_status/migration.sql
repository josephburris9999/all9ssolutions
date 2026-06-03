-- Remove send-failure status; only bounce and deliver are tracked.
UPDATE "ConsultationRequest"
SET "emailDeliveryStatus" = NULL,
    "emailBouncedAt" = NULL
WHERE "emailDeliveryStatus" = 'failed';

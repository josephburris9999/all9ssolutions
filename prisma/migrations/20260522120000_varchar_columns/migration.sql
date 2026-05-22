-- AlterTable: TEXT -> VARCHAR (matches prisma/schema.prisma)
ALTER TABLE "ConsultationRequest" ALTER COLUMN "id" TYPE VARCHAR(30);
ALTER TABLE "ConsultationRequest" ALTER COLUMN "name" TYPE VARCHAR(200);
ALTER TABLE "ConsultationRequest" ALTER COLUMN "email" TYPE VARCHAR(254);
ALTER TABLE "ConsultationRequest" ALTER COLUMN "phone" TYPE VARCHAR(30);
ALTER TABLE "ConsultationRequest" ALTER COLUMN "timezone" TYPE VARCHAR(100);
ALTER TABLE "ConsultationRequest" ALTER COLUMN "preferredContact" TYPE VARCHAR(1);
ALTER TABLE "ConsultationRequest" ALTER COLUMN "company" TYPE VARCHAR(200);
ALTER TABLE "ConsultationRequest" ALTER COLUMN "message" TYPE VARCHAR(10000);

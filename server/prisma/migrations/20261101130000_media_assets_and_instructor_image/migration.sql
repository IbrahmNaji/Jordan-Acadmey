CREATE TYPE "MediaPurpose" AS ENUM ('VEHICLE_IMAGE', 'INSTRUCTOR_IMAGE');

CREATE TABLE "MediaAsset" (
  "id" TEXT NOT NULL,
  "purpose" "MediaPurpose" NOT NULL,
  "mimeType" TEXT NOT NULL,
  "data" BYTEA NOT NULL,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Instructor" ADD COLUMN "imageUrl" TEXT;

CREATE INDEX "MediaAsset_purpose_createdAt_idx" ON "MediaAsset"("purpose", "createdAt");
CREATE INDEX "MediaAsset_createdById_idx" ON "MediaAsset"("createdById");

ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

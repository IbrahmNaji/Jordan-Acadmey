ALTER TYPE "MediaPurpose" ADD VALUE 'SPARE_PART_IMAGE';

CREATE TYPE "SparePartListingStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

CREATE TABLE "SparePartListing" (
  "id" TEXT NOT NULL,
  "partName" TEXT NOT NULL,
  "partNumber" TEXT,
  "vehicleMake" TEXT,
  "vehicleModel" TEXT,
  "vehicleYear" INTEGER,
  "description" TEXT,
  "price" DECIMAL(12,2),
  "currency" TEXT NOT NULL DEFAULT 'SYP',
  "mediaPaths" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "status" "SparePartListingStatus" NOT NULL DEFAULT 'DRAFT',
  "publishedAt" TIMESTAMP(3),
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SparePartListing_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SparePartListing_status_publishedAt_idx" ON "SparePartListing"("status", "publishedAt");
CREATE INDEX "SparePartListing_partName_idx" ON "SparePartListing"("partName");
CREATE INDEX "SparePartListing_createdById_idx" ON "SparePartListing"("createdById");

ALTER TABLE "SparePartListing" ADD CONSTRAINT "SparePartListing_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

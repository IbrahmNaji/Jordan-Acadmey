-- CreateEnum
CREATE TYPE "VehicleListingStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'SOLD', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "OwnerAuthorizationMethod" AS ENUM ('SIGNED_DOCUMENT', 'RECORDED_CALL', 'VERIFIED_MESSAGE', 'IN_PERSON');

-- AlterEnum
ALTER TYPE "ActivityType" ADD VALUE 'VEHICLE_INQUIRY';

-- DropForeignKey
ALTER TABLE "Activity" DROP CONSTRAINT "Activity_userId_fkey";

-- AlterTable
ALTER TABLE "Activity" ALTER COLUMN "userId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "VehicleListing" (
    "id" TEXT NOT NULL,
    "ownerCustomerId" TEXT NOT NULL,
    "assignedToId" TEXT,
    "reviewedById" TEXT,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "mileage" INTEGER,
    "transmission" TEXT,
    "fuelType" TEXT,
    "vin" TEXT,
    "city" TEXT NOT NULL,
    "description" TEXT,
    "askingPrice" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SYP',
    "isPriceNegotiable" BOOLEAN NOT NULL DEFAULT false,
    "conditionVerifiedAt" TIMESTAMP(3),
    "inspectionReference" TEXT,
    "mediaPaths" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ownerAuthorizationMethod" "OwnerAuthorizationMethod" NOT NULL,
    "ownerAuthorizationNote" TEXT NOT NULL,
    "ownerAuthorizationPath" TEXT,
    "ownerAuthorizedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "VehicleListingStatus" NOT NULL DEFAULT 'DRAFT',
    "moderationNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "soldAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleInquiry" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VehicleListing_status_publishedAt_idx" ON "VehicleListing"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "VehicleListing_ownerCustomerId_idx" ON "VehicleListing"("ownerCustomerId");

-- CreateIndex
CREATE INDEX "VehicleListing_assignedToId_idx" ON "VehicleListing"("assignedToId");

-- CreateIndex
CREATE INDEX "VehicleListing_make_model_year_idx" ON "VehicleListing"("make", "model", "year");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleInquiry_leadId_key" ON "VehicleInquiry"("leadId");

-- CreateIndex
CREATE INDEX "VehicleInquiry_listingId_createdAt_idx" ON "VehicleInquiry"("listingId", "createdAt");

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleListing" ADD CONSTRAINT "VehicleListing_ownerCustomerId_fkey" FOREIGN KEY ("ownerCustomerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleListing" ADD CONSTRAINT "VehicleListing_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleListing" ADD CONSTRAINT "VehicleListing_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleInquiry" ADD CONSTRAINT "VehicleInquiry_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "VehicleListing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleInquiry" ADD CONSTRAINT "VehicleInquiry_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;


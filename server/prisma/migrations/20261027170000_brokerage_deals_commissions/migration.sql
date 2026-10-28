CREATE TYPE "BrokerageDealStatus" AS ENUM ('NEW_INQUIRY', 'CONTACTED', 'QUALIFIED', 'VIEWING_SCHEDULED', 'NEGOTIATION', 'AGREEMENT_PENDING', 'COMPLETED', 'LOST', 'CANCELLED');
CREATE TYPE "ViewingStatus" AS ENUM ('REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
CREATE TYPE "CommissionPayer" AS ENUM ('BUYER', 'SELLER', 'OTHER');
CREATE TYPE "CommissionCalculationType" AS ENUM ('FIXED', 'PERCENTAGE');

CREATE TABLE "BrokerageDeal" (
  "id" TEXT NOT NULL,
  "listingId" TEXT NOT NULL,
  "buyerCustomerId" TEXT NOT NULL,
  "sellerCustomerId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "status" "BrokerageDealStatus" NOT NULL DEFAULT 'NEW_INQUIRY',
  "expectedAmount" DECIMAL(12,2),
  "finalAmount" DECIMAL(12,2),
  "currency" TEXT NOT NULL DEFAULT 'SYP',
  "outcomeNote" TEXT,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BrokerageDeal_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "BrokerageDealStageHistory" (
  "id" TEXT NOT NULL,
  "dealId" TEXT NOT NULL,
  "from" "BrokerageDealStatus",
  "to" "BrokerageDealStatus" NOT NULL,
  "reason" TEXT,
  "actorId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BrokerageDealStageHistory_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "VehicleViewing" (
  "id" TEXT NOT NULL,
  "dealId" TEXT NOT NULL,
  "scheduledAt" TIMESTAMP(3) NOT NULL,
  "status" "ViewingStatus" NOT NULL DEFAULT 'REQUESTED',
  "location" TEXT,
  "notes" TEXT,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VehicleViewing_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CommissionAgreement" (
  "id" TEXT NOT NULL,
  "dealId" TEXT NOT NULL,
  "payer" "CommissionPayer" NOT NULL,
  "otherPayerName" TEXT,
  "calculationType" "CommissionCalculationType" NOT NULL,
  "calculationBasis" TEXT NOT NULL,
  "basisAmount" DECIMAL(12,2) NOT NULL,
  "rateOrAmount" DECIMAL(12,2) NOT NULL,
  "amountDue" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'SYP',
  "agreementReference" TEXT NOT NULL,
  "notes" TEXT,
  "approvedById" TEXT NOT NULL,
  "agreedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CommissionAgreement_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CommissionPayment" (
  "id" TEXT NOT NULL,
  "agreementId" TEXT NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL,
  "method" "PaymentMethod" NOT NULL DEFAULT 'CASH',
  "reference" TEXT,
  "note" TEXT,
  "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "recordedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommissionPayment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BrokerageDeal_listingId_status_idx" ON "BrokerageDeal"("listingId", "status");
CREATE INDEX "BrokerageDeal_buyerCustomerId_idx" ON "BrokerageDeal"("buyerCustomerId");
CREATE INDEX "BrokerageDeal_sellerCustomerId_idx" ON "BrokerageDeal"("sellerCustomerId");
CREATE INDEX "BrokerageDeal_createdById_status_idx" ON "BrokerageDeal"("createdById", "status");
CREATE INDEX "BrokerageDeal_createdAt_idx" ON "BrokerageDeal"("createdAt");
CREATE INDEX "BrokerageDealStageHistory_dealId_createdAt_idx" ON "BrokerageDealStageHistory"("dealId", "createdAt");
CREATE INDEX "VehicleViewing_dealId_scheduledAt_idx" ON "VehicleViewing"("dealId", "scheduledAt");
CREATE UNIQUE INDEX "CommissionAgreement_dealId_payer_key" ON "CommissionAgreement"("dealId", "payer");
CREATE INDEX "CommissionAgreement_approvedById_agreedAt_idx" ON "CommissionAgreement"("approvedById", "agreedAt");
CREATE INDEX "CommissionPayment_agreementId_paidAt_idx" ON "CommissionPayment"("agreementId", "paidAt");

ALTER TABLE "BrokerageDeal" ADD CONSTRAINT "BrokerageDeal_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "VehicleListing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BrokerageDeal" ADD CONSTRAINT "BrokerageDeal_buyerCustomerId_fkey" FOREIGN KEY ("buyerCustomerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BrokerageDeal" ADD CONSTRAINT "BrokerageDeal_sellerCustomerId_fkey" FOREIGN KEY ("sellerCustomerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BrokerageDeal" ADD CONSTRAINT "BrokerageDeal_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BrokerageDealStageHistory" ADD CONSTRAINT "BrokerageDealStageHistory_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "BrokerageDeal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BrokerageDealStageHistory" ADD CONSTRAINT "BrokerageDealStageHistory_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "VehicleViewing" ADD CONSTRAINT "VehicleViewing_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "BrokerageDeal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VehicleViewing" ADD CONSTRAINT "VehicleViewing_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CommissionAgreement" ADD CONSTRAINT "CommissionAgreement_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "BrokerageDeal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CommissionAgreement" ADD CONSTRAINT "CommissionAgreement_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CommissionPayment" ADD CONSTRAINT "CommissionPayment_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "CommissionAgreement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CommissionPayment" ADD CONSTRAINT "CommissionPayment_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

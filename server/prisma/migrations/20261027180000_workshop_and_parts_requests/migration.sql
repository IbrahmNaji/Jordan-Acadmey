-- CreateEnum
CREATE TYPE "WorkshopRequestStatus" AS ENUM ('NEW', 'REVIEWING', 'CONFIRMED', 'CANCELLED', 'RECEIVED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "WorkOrderStatus" AS ENUM ('RECEIVED', 'DIAGNOSING', 'ESTIMATE_PENDING', 'AWAITING_CUSTOMER_APPROVAL', 'IN_PROGRESS', 'QUALITY_CHECK', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PartsRequestStatus" AS ENUM ('NEW', 'REVIEWING', 'SOURCING', 'QUOTED', 'AWAITING_CUSTOMER', 'APPROVED', 'ORDERED', 'FULFILLED', 'UNAVAILABLE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PartsAvailability" AS ENUM ('UNCONFIRMED', 'AVAILABLE', 'BACKORDERED', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "QuoteDecision" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "WorkshopRequest" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "vehicleMake" TEXT NOT NULL,
    "vehicleModel" TEXT NOT NULL,
    "vehicleYear" INTEGER,
    "requestedService" TEXT NOT NULL,
    "reportedSymptoms" TEXT,
    "preferredAt" TIMESTAMP(3),
    "status" "WorkshopRequestStatus" NOT NULL DEFAULT 'NEW',
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkshopRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkshopWorkOrder" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "technicianId" TEXT,
    "createdById" TEXT NOT NULL,
    "status" "WorkOrderStatus" NOT NULL DEFAULT 'RECEIVED',
    "confirmedDiagnosis" TEXT,
    "estimateAmount" DECIMAL(12,2),
    "finalAmount" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'SYP',
    "customerApprovedAt" TIMESTAMP(3),
    "customerApprovalReference" TEXT,
    "completedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkshopWorkOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkshopInspectionRecord" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "technicianId" TEXT NOT NULL,
    "checklist" JSONB NOT NULL,
    "confirmedFindings" TEXT NOT NULL,
    "recommendations" TEXT,
    "inspectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkshopInspectionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkshopPayment" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "reference" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkshopPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartsRequest" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "vehicleMake" TEXT NOT NULL,
    "vehicleModel" TEXT NOT NULL,
    "vehicleYear" INTEGER,
    "partName" TEXT NOT NULL,
    "partNumber" TEXT,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" "PartsRequestStatus" NOT NULL DEFAULT 'NEW',
    "customerNotes" TEXT,
    "internalNotes" TEXT,
    "fulfilledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartsRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartsQuotation" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "supplierReference" TEXT,
    "quotedPrice" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SYP',
    "availability" "PartsAvailability" NOT NULL DEFAULT 'UNCONFIRMED',
    "estimatedLeadTime" TEXT,
    "customerDecision" "QuoteDecision" NOT NULL DEFAULT 'PENDING',
    "decisionAt" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "customerDecisionReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartsQuotation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkshopRequest_status_createdAt_idx" ON "WorkshopRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "WorkshopRequest_customerId_createdAt_idx" ON "WorkshopRequest"("customerId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WorkshopWorkOrder_requestId_key" ON "WorkshopWorkOrder"("requestId");

-- CreateIndex
CREATE INDEX "WorkshopWorkOrder_status_createdAt_idx" ON "WorkshopWorkOrder"("status", "createdAt");

-- CreateIndex
CREATE INDEX "WorkshopWorkOrder_technicianId_status_idx" ON "WorkshopWorkOrder"("technicianId", "status");

-- CreateIndex
CREATE INDEX "WorkshopInspectionRecord_workOrderId_inspectedAt_idx" ON "WorkshopInspectionRecord"("workOrderId", "inspectedAt");

-- CreateIndex
CREATE INDEX "WorkshopPayment_workOrderId_paidAt_idx" ON "WorkshopPayment"("workOrderId", "paidAt");

-- CreateIndex
CREATE INDEX "PartsRequest_status_createdAt_idx" ON "PartsRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PartsRequest_customerId_createdAt_idx" ON "PartsRequest"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX "PartsQuotation_requestId_createdAt_idx" ON "PartsQuotation"("requestId", "createdAt");

-- CreateIndex
CREATE INDEX "PartsQuotation_customerDecision_idx" ON "PartsQuotation"("customerDecision");

-- AddForeignKey
ALTER TABLE "WorkshopRequest" ADD CONSTRAINT "WorkshopRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkshopWorkOrder" ADD CONSTRAINT "WorkshopWorkOrder_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "WorkshopRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkshopWorkOrder" ADD CONSTRAINT "WorkshopWorkOrder_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkshopWorkOrder" ADD CONSTRAINT "WorkshopWorkOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkshopInspectionRecord" ADD CONSTRAINT "WorkshopInspectionRecord_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkshopWorkOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkshopInspectionRecord" ADD CONSTRAINT "WorkshopInspectionRecord_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkshopPayment" ADD CONSTRAINT "WorkshopPayment_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkshopWorkOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkshopPayment" ADD CONSTRAINT "WorkshopPayment_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartsRequest" ADD CONSTRAINT "PartsRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartsQuotation" ADD CONSTRAINT "PartsQuotation_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "PartsRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartsQuotation" ADD CONSTRAINT "PartsQuotation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

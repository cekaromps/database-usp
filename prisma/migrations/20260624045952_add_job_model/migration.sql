-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "jobName" TEXT NOT NULL,
    "qty" DECIMAL(10,2) NOT NULL,
    "uom" TEXT NOT NULL,
    "customer" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "poNumber" TEXT NOT NULL,
    "leadTime" INTEGER,
    "materialStatus" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Job_customer_idx" ON "Job"("customer");

-- CreateIndex
CREATE INDEX "Job_poNumber_idx" ON "Job"("poNumber");

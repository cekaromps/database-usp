-- CreateTable
CREATE TABLE "SoaStatement" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "period" TEXT NOT NULL,
    "statementNumber" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "totalIdr" DECIMAL(18,2) NOT NULL,
    "netIdr" DECIMAL(18,2) NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SoaStatement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SoaStatement_period_idx" ON "SoaStatement"("period");

-- CreateIndex
CREATE UNIQUE INDEX "SoaStatement_customerId_period_key" ON "SoaStatement"("customerId", "period");

-- AddForeignKey
ALTER TABLE "SoaStatement" ADD CONSTRAINT "SoaStatement_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

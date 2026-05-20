-- CreateTable
CREATE TABLE "InvoiceRecord" (
    "id" TEXT NOT NULL,
    "customer" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quotationNumber" TEXT NOT NULL,
    "noPo" TEXT NOT NULL,
    "dateDelivery" TIMESTAMP(3) NOT NULL,
    "noDo" TEXT NOT NULL,
    "noInv" TEXT NOT NULL,
    "amoundIdr" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceRecord_pkey" PRIMARY KEY ("id")
);

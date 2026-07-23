-- CreateTable
CREATE TABLE "Ecom" (
    "id" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "qty" DECIMAL(10,2) NOT NULL,
    "description" TEXT NOT NULL,
    "size" INTEGER,
    "diameter" INTEGER,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ecom_pkey" PRIMARY KEY ("id")
);

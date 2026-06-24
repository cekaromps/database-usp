-- CreateEnum
CREATE TYPE "TaskStage" AS ENUM ('DRAWING', 'MATERIAL', 'TOOLING', 'PRODUCTION', 'SUBCON', 'FINISHED');

-- CreateTable
CREATE TABLE "PoTask" (
    "id" TEXT NOT NULL,
    "poNumber" TEXT NOT NULL,
    "description" TEXT,
    "currentStage" "TaskStage" NOT NULL DEFAULT 'DRAWING',
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "estimatedDelivery" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PoTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PoTask_poNumber_key" ON "PoTask"("poNumber");

-- CreateTable
CREATE TABLE "PoTaskItem" (
    "id" TEXT NOT NULL,
    "poTaskId" TEXT NOT NULL,
    "stage" "TaskStage" NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION,
    "unit" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PoTaskItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PoTaskItem_poTaskId_stage_idx" ON "PoTaskItem"("poTaskId", "stage");

-- AddForeignKey
ALTER TABLE "PoTaskItem" ADD CONSTRAINT "PoTaskItem_poTaskId_fkey" FOREIGN KEY ("poTaskId") REFERENCES "PoTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

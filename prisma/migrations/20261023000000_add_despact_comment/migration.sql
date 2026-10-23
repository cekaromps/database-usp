-- CreateTable
CREATE TABLE "DespactComment" (
    "id" SERIAL NOT NULL,
    "despactId" INTEGER NOT NULL,
    "authorId" TEXT,
    "authorName" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DespactComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DespactComment_despactId_createdAt_idx" ON "DespactComment"("despactId", "createdAt");

-- AddForeignKey
ALTER TABLE "DespactComment" ADD CONSTRAINT "DespactComment_despactId_fkey" FOREIGN KEY ("despactId") REFERENCES "Despact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

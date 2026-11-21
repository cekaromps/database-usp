-- AlterTable
ALTER TABLE "DespactItem" ADD COLUMN "closedAt" TIMESTAMP(3);

-- Backfill: items that are already closed start their 2-month retention clock now
UPDATE "DespactItem" SET "closedAt" = CURRENT_TIMESTAMP WHERE "status" = 'CLOSE' AND "closedAt" IS NULL;

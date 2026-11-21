-- AlterTable
-- DO number is captured when finance closes a despact item. Nullable so items that are
-- already closed (or still open) keep working.
ALTER TABLE "DespactItem" ADD COLUMN "doNumber" TEXT;

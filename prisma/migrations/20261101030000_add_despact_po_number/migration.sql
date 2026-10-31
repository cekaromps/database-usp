-- AlterTable
-- PO number is typed in when a despact is created (like the quotation number).
-- Nullable so existing despacts stay as they are.
ALTER TABLE "Despact" ADD COLUMN "poNumber" TEXT;

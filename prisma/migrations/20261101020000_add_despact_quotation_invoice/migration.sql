-- AlterTable
-- Quotation number is typed in when a despact is created. Nullable so existing despacts stay as they are.
ALTER TABLE "Despact" ADD COLUMN "quotationNumber" TEXT;

-- AlterTable
-- Invoice number is typed in when an item moves to Ready Delivery. Nullable for the same reason.
ALTER TABLE "DespactItem" ADD COLUMN "invoiceNumber" TEXT;

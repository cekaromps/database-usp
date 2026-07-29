-- CreateEnum
CREATE TYPE "EcomCategory" AS ENUM ('MATERIALS', 'TOOLING', 'STANDARD_PART');

-- AlterTable
-- Both columns are nullable so this is safe on a table that may already
-- have rows (existing items simply have no category until edited/re-saved).
ALTER TABLE "Ecom" ADD COLUMN "category" "EcomCategory";
ALTER TABLE "Ecom" ADD COLUMN "subCategory" TEXT;

-- CreateIndex
CREATE INDEX "Ecom_category_idx" ON "Ecom"("category");

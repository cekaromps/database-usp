-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "materials" TEXT[] DEFAULT ARRAY[]::TEXT[];

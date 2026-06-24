/*
  Warnings:

  - Added the required column `invoiceNo` to the `JournalLine` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "JournalLine" ADD COLUMN "invoiceNo" TEXT;

-- Backfill existing rows
UPDATE "JournalLine" SET "invoiceNo" = 'LEGACY' WHERE "invoiceNo" IS NULL;

-- Now enforce NOT NULL
ALTER TABLE "JournalLine" ALTER COLUMN "invoiceNo" SET NOT NULL;

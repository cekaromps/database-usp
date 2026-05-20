/*
  Warnings:

  - Added the required column `remark` to the `InvoiceRecord` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "InvoiceRecord" ADD COLUMN     "remark" TEXT NOT NULL;

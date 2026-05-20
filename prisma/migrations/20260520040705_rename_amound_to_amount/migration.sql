/*
  Warnings:

  - You are about to drop the column `amoundIdr` on the `InvoiceRecord` table. All the data in the column will be lost.
  - Added the required column `amountIdr` to the `InvoiceRecord` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "InvoiceRecord" DROP COLUMN "amoundIdr",
ADD COLUMN     "amountIdr" DOUBLE PRECISION NOT NULL;

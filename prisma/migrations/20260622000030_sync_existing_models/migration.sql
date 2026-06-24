-- CreateEnum
CREATE TYPE "public"."AccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');

-- CreateEnum
CREATE TYPE "public"."EntryStatus" AS ENUM ('DRAFT', 'POSTED', 'VOIDED');

-- CreateEnum
CREATE TYPE "public"."ItemType" AS ENUM ('FOLDER', 'FILE');

-- AlterTable
ALTER TABLE "public"."InvoiceRecord" ADD COLUMN     "qty" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "public"."ChartOfAccount" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."AccountType" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChartOfAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Invoice" (
    "id" TEXT NOT NULL,
    "customer" TEXT NOT NULL,
    "attn" TEXT NOT NULL,
    "cc" TEXT NOT NULL DEFAULT '-',
    "term" TEXT NOT NULL,
    "validity" TEXT NOT NULL,
    "leadTime" TEXT NOT NULL,
    "fromUser" TEXT NOT NULL,
    "handphone" TEXT NOT NULL,
    "quotationNumber" TEXT NOT NULL,
    "dateDelivery" TIMESTAMP(3) NOT NULL,
    "noInv" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "amountIdr" DOUBLE PRECISION NOT NULL,
    "remark" TEXT NOT NULL DEFAULT 'Prices are valid 1 month after offer is sent',
    "address" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processes" TEXT NOT NULL DEFAULT '-',
    "material" TEXT NOT NULL DEFAULT '-',
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'pcs',

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Item" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."ItemType" NOT NULL,
    "s3Key" TEXT,
    "url" TEXT,
    "size" INTEGER,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "contentData" JSONB,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."JournalEntry" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "reference" TEXT,
    "description" TEXT NOT NULL,
    "status" "public"."EntryStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "job" TEXT,
    "qty" INTEGER DEFAULT 0,
    "uom" TEXT,

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."JournalLine" (
    "id" TEXT NOT NULL,
    "journalEntryId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "debit" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "credit" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JournalLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChartOfAccount_code_key" ON "public"."ChartOfAccount"("code" ASC);

-- CreateIndex
CREATE INDEX "Item_parentId_idx" ON "public"."Item"("parentId" ASC);

-- AddForeignKey
ALTER TABLE "public"."Item" ADD CONSTRAINT "Item_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JournalLine" ADD CONSTRAINT "JournalLine_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."ChartOfAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JournalLine" ADD CONSTRAINT "JournalLine_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "public"."JournalEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;


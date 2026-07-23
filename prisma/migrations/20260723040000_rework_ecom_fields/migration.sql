-- Rework "Ecom" columns: itemName -> name, qty -> quantity (Int), drop description,
-- add price, widen size to free-text, widen diameter to allow decimals.
-- Written as ALTER statements (not DROP/CREATE) because this table is already
-- deployed to production and may contain rows.

-- itemName -> name
ALTER TABLE "Ecom" RENAME COLUMN "itemName" TO "name";

-- drop description (no longer part of the model)
ALTER TABLE "Ecom" DROP COLUMN "description";

-- add price (required); default 0 lets existing rows migrate, then default is dropped
-- so new inserts must supply a value going forward
ALTER TABLE "Ecom" ADD COLUMN "price" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Ecom" ALTER COLUMN "price" DROP DEFAULT;

-- qty (Decimal) -> quantity (Int)
ALTER TABLE "Ecom" RENAME COLUMN "qty" TO "quantity";
ALTER TABLE "Ecom" ALTER COLUMN "quantity" TYPE INTEGER USING ROUND("quantity")::INTEGER;
ALTER TABLE "Ecom" ALTER COLUMN "quantity" SET DEFAULT 1;

-- size: nullable Int -> required free-text
ALTER TABLE "Ecom" ALTER COLUMN "size" TYPE TEXT USING COALESCE("size"::TEXT, '');
ALTER TABLE "Ecom" ALTER COLUMN "size" SET NOT NULL;

-- diameter: Int? -> Float? (still optional)
ALTER TABLE "Ecom" ALTER COLUMN "diameter" TYPE DOUBLE PRECISION USING "diameter"::DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "Ecom_name_idx" ON "Ecom"("name");

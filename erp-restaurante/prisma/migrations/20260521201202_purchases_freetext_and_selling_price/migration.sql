-- DropForeignKey
ALTER TABLE "Purchase_items" DROP CONSTRAINT "Purchase_items_id_product_fkey";

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "selling_price" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Purchase_items" ADD COLUMN     "name" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "unit_measurement" TEXT NOT NULL DEFAULT 'un',
ALTER COLUMN "id_product" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Purchase_items" ADD CONSTRAINT "Purchase_items_id_product_fkey" FOREIGN KEY ("id_product") REFERENCES "Product"("id_product") ON DELETE SET NULL ON UPDATE CASCADE;

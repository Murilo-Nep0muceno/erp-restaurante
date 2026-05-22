-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "id_supplier" UUID,
ADD COLUMN     "type" TEXT DEFAULT 'INGREDIENTE',
ADD COLUMN     "unit_price" DOUBLE PRECISION;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_id_supplier_fkey" FOREIGN KEY ("id_supplier") REFERENCES "Supplier"("id_supplier") ON DELETE SET NULL ON UPDATE CASCADE;

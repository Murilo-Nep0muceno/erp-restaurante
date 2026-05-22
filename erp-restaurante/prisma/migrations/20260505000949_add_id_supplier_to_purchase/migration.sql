/*
  Warnings:

  - Added the required column `id_supplier` to the `Purchase` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN     "id_supplier" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_id_supplier_fkey" FOREIGN KEY ("id_supplier") REFERENCES "Supplier"("id_supplier") ON DELETE RESTRICT ON UPDATE CASCADE;

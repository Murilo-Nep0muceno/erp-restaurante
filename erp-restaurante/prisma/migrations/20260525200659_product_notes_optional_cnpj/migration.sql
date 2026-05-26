-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "Supplier" ALTER COLUMN "cnpj" DROP NOT NULL;

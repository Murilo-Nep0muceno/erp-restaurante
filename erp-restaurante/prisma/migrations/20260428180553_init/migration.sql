-- CreateEnum
CREATE TYPE "Role" AS ENUM ('GERENTE', 'BALCONISTA', 'GARCOM');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userName" TEXT NOT NULL,
    "passWord" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id_product" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "unit_measurement" DOUBLE PRECISION NOT NULL,
    "current_quantity" DOUBLE PRECISION NOT NULL,
    "minimum_quantity" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id_product")
);

-- CreateTable
CREATE TABLE "Purchase" (
    "id_purchase" UUID NOT NULL DEFAULT gen_random_uuid(),
    "total_price" DOUBLE PRECISION NOT NULL,
    "date" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id_purchase")
);

-- CreateTable
CREATE TABLE "Purchase_items" (
    "id_purchase_items" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_product" UUID NOT NULL,
    "id_purchase" UUID NOT NULL,
    "unit_price" DOUBLE PRECISION NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Purchase_items_pkey" PRIMARY KEY ("id_purchase_items")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id_supplier" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id_supplier")
);

-- CreateTable
CREATE TABLE "Product_supplier" (
    "id_product_supplier" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_product" UUID NOT NULL,
    "id_supplier" UUID NOT NULL,

    CONSTRAINT "Product_supplier_pkey" PRIMARY KEY ("id_product_supplier")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_userName_key" ON "User"("userName");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_cnpj_key" ON "Supplier"("cnpj");

-- AddForeignKey
ALTER TABLE "Purchase_items" ADD CONSTRAINT "Purchase_items_id_product_fkey" FOREIGN KEY ("id_product") REFERENCES "Product"("id_product") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase_items" ADD CONSTRAINT "Purchase_items_id_purchase_fkey" FOREIGN KEY ("id_purchase") REFERENCES "Purchase"("id_purchase") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product_supplier" ADD CONSTRAINT "Product_supplier_id_product_fkey" FOREIGN KEY ("id_product") REFERENCES "Product"("id_product") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product_supplier" ADD CONSTRAINT "Product_supplier_id_supplier_fkey" FOREIGN KEY ("id_supplier") REFERENCES "Supplier"("id_supplier") ON DELETE RESTRICT ON UPDATE CASCADE;

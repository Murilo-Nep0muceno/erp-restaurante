-- CreateTable
CREATE TABLE "Movement_stock" (
    "id_movement_stock" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_product" UUID NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Movement_stock_pkey" PRIMARY KEY ("id_movement_stock")
);

-- AddForeignKey
ALTER TABLE "Movement_stock" ADD CONSTRAINT "Movement_stock_id_product_fkey" FOREIGN KEY ("id_product") REFERENCES "Product"("id_product") ON DELETE RESTRICT ON UPDATE CASCADE;

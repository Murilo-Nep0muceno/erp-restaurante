-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'COZINHA';

-- CreateTable
CREATE TABLE "Order" (
    "id_order" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "tableNum" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id_order")
);

-- CreateTable
CREATE TABLE "Order_item" (
    "id_order_item" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_order" UUID NOT NULL,
    "dishId" TEXT,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "qty" INTEGER NOT NULL,
    "notes" TEXT,

    CONSTRAINT "Order_item_pkey" PRIMARY KEY ("id_order_item")
);

-- AddForeignKey
ALTER TABLE "Order_item" ADD CONSTRAINT "Order_item_id_order_fkey" FOREIGN KEY ("id_order") REFERENCES "Order"("id_order") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "Recipe_Dish" (
    "id_dish" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name_dish" TEXT NOT NULL,
    "description_dish" TEXT NOT NULL,
    "selling_price_dish" DOUBLE PRECISION NOT NULL,
    "available_dish" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recipe_Dish_pkey" PRIMARY KEY ("id_dish")
);

-- CreateTable
CREATE TABLE "Dish" (
    "id_recipe_dish" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_dish" UUID NOT NULL,
    "id_product" UUID NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Dish_pkey" PRIMARY KEY ("id_recipe_dish")
);

-- AddForeignKey
ALTER TABLE "Dish" ADD CONSTRAINT "Dish_id_recipe_dish_fkey" FOREIGN KEY ("id_recipe_dish") REFERENCES "Recipe_Dish"("id_dish") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dish" ADD CONSTRAINT "Dish_id_product_fkey" FOREIGN KEY ("id_product") REFERENCES "Product"("id_product") ON DELETE RESTRICT ON UPDATE CASCADE;

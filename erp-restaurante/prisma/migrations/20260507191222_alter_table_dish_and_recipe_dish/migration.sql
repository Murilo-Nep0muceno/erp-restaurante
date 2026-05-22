/*
  Warnings:

  - The primary key for the `Dish` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Recipe_Dish` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id_dish` on the `Recipe_Dish` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Dish" DROP CONSTRAINT "Dish_id_recipe_dish_fkey";

-- AlterTable
ALTER TABLE "Dish" DROP CONSTRAINT "Dish_pkey",
ALTER COLUMN "id_recipe_dish" DROP DEFAULT,
ALTER COLUMN "id_dish" SET DEFAULT gen_random_uuid(),
ADD CONSTRAINT "Dish_pkey" PRIMARY KEY ("id_dish");

-- AlterTable
ALTER TABLE "Recipe_Dish" DROP CONSTRAINT "Recipe_Dish_pkey",
DROP COLUMN "id_dish",
ADD COLUMN     "id_recipe_dish" UUID NOT NULL DEFAULT gen_random_uuid(),
ADD CONSTRAINT "Recipe_Dish_pkey" PRIMARY KEY ("id_recipe_dish");

-- AddForeignKey
ALTER TABLE "Dish" ADD CONSTRAINT "Dish_id_recipe_dish_fkey" FOREIGN KEY ("id_recipe_dish") REFERENCES "Recipe_Dish"("id_recipe_dish") ON DELETE RESTRICT ON UPDATE CASCADE;

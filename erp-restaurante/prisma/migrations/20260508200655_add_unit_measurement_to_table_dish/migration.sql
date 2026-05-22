/*
  Warnings:

  - Added the required column `unit_measurement` to the `Dish` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Dish" ADD COLUMN     "unit_measurement" TEXT NOT NULL;

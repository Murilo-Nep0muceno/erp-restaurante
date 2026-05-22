/*
  Warnings:

  - A unique constraint covering the columns `[hash]` on the table `Purchase` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `hash` to the `Purchase` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN     "hash" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Purchase_hash_key" ON "Purchase"("hash");

-- AlterTable
ALTER TABLE "Setting" ADD COLUMN     "kitchenClosed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "kitchenClosedAt" TIMESTAMP(3);

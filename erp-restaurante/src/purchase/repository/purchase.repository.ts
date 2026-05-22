import { Injectable } from '@nestjs/common';
import { Prisma, Purchase, Product } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
@Injectable()
export class PurchaseRepository {
  constructor(private prisma: PrismaService) {}

  async createPurchase(data: Prisma.PurchaseCreateInput): Promise<Purchase> {
    return await this.prisma.purchase.create({ data });
  }

  async getAllProducts(idProduct: string[]): Promise<Product[]> {
    const products = await this.prisma.product.findMany({
      where: {
        id_product: {
          in: idProduct,
        },
      },
    });
    return products;
  }

  async getProductsByNames(names: string[]): Promise<Product[]> {
    return await this.prisma.product.findMany({
      where: { name: { in: names } },
    });
  }

  async createManyPurchaseItems(data: Prisma.Purchase_itemsCreateManyInput[]) {
    return await this.prisma.purchase_items.createMany({ data });
  }

  async createManyProductSupplier(
    data: Prisma.Product_supplierCreateManyInput[],
  ) {
    return await this.prisma.product_supplier.createMany({ data });
  }

  async findByHash(hash: string): Promise<Purchase | null> {
    return await this.prisma.purchase.findUnique({
      where: {
        hash,
      },
    });
  }

  async createStockMovement(
    data: Prisma.Movement_stockCreateManyInput[],
  ): Promise<Prisma.BatchPayload> {
    return await this.prisma.movement_stock.createMany({ data });
  }

  async updateQuantityProduct(
    items: { id_product: string; quantity: number }[],
  ) {
    return await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.product.update({
          where: {
            id_product: item.id_product,
          },
          data: {
            current_quantity: item.quantity,
          },
        }),
      ),
    );
  }

  async getAllPurchases() {
    return await this.prisma.purchase.findMany({
      include: {
        purchase_items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async getPurchasesByIds(id: string) {
    return await this.prisma.purchase.findMany({
      where: {
        id_purchase: id,
      },
      include: {
        purchase_items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async deletePurchase(id: string) {
    return await this.prisma.purchase.delete({
      where: {
        id_purchase: id,
      },
    });
  }
}

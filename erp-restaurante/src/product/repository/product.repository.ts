import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Prisma, Product } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ProductRepository {
  constructor(private prisma: PrismaService) {}

  async createProduct(
    data: Prisma.ProductUncheckedCreateInput,
  ): Promise<Product> {
    try {
      return this.prisma.product.create({ data });
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Erro ao criar produto no repositório',
        error: error instanceof Error ? error.message : 'unknown',
      });
    }
  }

  async findByName(name: string): Promise<Product | null> {
    return this.prisma.product.findFirst({
      where: { name },
    });
  }

  async findById(id: string): Promise<Product | null> {
    return this.prisma.product.findUnique({
      where: { id_product: id },
    });
  }

  async findDishesUsingProduct(
    id: string,
  ): Promise<{ id_recipe_dish: string; name_dish: string }[]> {
    const rows = await this.prisma.dish.findMany({
      where: { id_product: id },
      select: { recipe_dish: { select: { id_recipe_dish: true, name_dish: true } } },
    });
    const byId = new Map<string, string>();
    for (const r of rows) byId.set(r.recipe_dish.id_recipe_dish, r.recipe_dish.name_dish);
    return [...byId].map(([id_recipe_dish, name_dish]) => ({ id_recipe_dish, name_dish }));
  }

  async deleteProduct(id: string, removeFromDishes = false): Promise<Product> {
    return this.prisma.$transaction(async (tx) => {
      // Só quando o usuário confirma a remoção do ingrediente das fichas.
      if (removeFromDishes) {
        await tx.dish.deleteMany({ where: { id_product: id } });
      }
      await tx.movement_stock.deleteMany({ where: { id_product: id } });
      await tx.product_supplier.deleteMany({ where: { id_product: id } });
      // Mantém o histórico da compra, mas solta a referência ao produto.
      await tx.purchase_items.updateMany({
        where: { id_product: id },
        data: { id_product: null },
      });
      return tx.product.delete({ where: { id_product: id } });
    });
  }

  async findAll(): Promise<Product[]> {
    return this.prisma.product.findMany({
      include: { supplier: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async update(
    id: string,
    data: Prisma.ProductUncheckedUpdateInput,
  ): Promise<Product> {
    return this.prisma.product.update({
      where: { id_product: id },
      data,
    });
  }

  async createMovement(data: Prisma.Movement_stockUncheckedCreateInput) {
    return this.prisma.movement_stock.create({ data });
  }

  async setDefaultSupplier(id_product: string, id_supplier: string) {
    return this.prisma.product.update({
      where: { id_product },
      data: { id_supplier },
    });
  }
}

import { Injectable } from '@nestjs/common';
import { Product } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

export interface NewProductInput {
  name: string;
  unit_measurement: string;
  quantity: number;
  unit_price: number;
}

export interface TopUpInput {
  id_product: string;
  quantity: number; // novo saldo total
  unit_price: number | null; // novo custo médio
  addQuantity: number; // quantidade somada (para a movimentação)
}

export interface PurchaseItemInput {
  name: string;
  unit_measurement: string;
  quantity: number;
  unit_price: number;
}

export interface CommitPurchaseInput {
  idSupplier: string;
  date: string;
  total: number;
  hash: string;
  newProducts: NewProductInput[];
  topUps: TopUpInput[];
  items: PurchaseItemInput[];
  existingIdByName: Record<string, string>;
}

@Injectable()
export class PurchaseRepository {
  constructor(private prisma: PrismaService) {}

  async getProductsByNames(names: string[]): Promise<Product[]> {
    return await this.prisma.product.findMany({
      where: { name: { in: names } },
    });
  }

  async findByHash(hash: string) {
    return await this.prisma.purchase.findUnique({ where: { hash } });
  }

  // Grava a compra inteira de forma atômica: cria produtos novos (itens cujo
  // nome não casou), registra a compra e seus itens (id_product sempre
  // resolvido), faz top-up dos existentes (saldo + custo médio), vincula
  // fornecedor e gera as movimentações de estoque.
  async commitPurchase(input: CommitPurchaseInput) {
    return this.prisma.$transaction(async (tx) => {
      const idByName: Record<string, string> = { ...input.existingIdByName };

      for (const np of input.newProducts) {
        const created = await tx.product.create({
          data: {
            name: np.name,
            unit_measurement: np.unit_measurement,
            current_quantity: np.quantity,
            minimum_quantity: 0,
            unit_price: np.unit_price,
            type: 'INGREDIENTE',
            id_supplier: input.idSupplier,
          },
        });
        idByName[np.name] = created.id_product;
      }

      const purchase = await tx.purchase.create({
        data: {
          date: input.date,
          total_price: input.total,
          hash: input.hash,
          supplier: { connect: { id_supplier: input.idSupplier } },
        },
      });

      await tx.purchase_items.createMany({
        data: input.items.map((it) => ({
          id_purchase: purchase.id_purchase,
          id_product: idByName[it.name] ?? null,
          name: it.name,
          unit_measurement: it.unit_measurement,
          quantity: it.quantity,
          unit_price: it.unit_price,
        })),
      });

      for (const t of input.topUps) {
        await tx.product.update({
          where: { id_product: t.id_product },
          data: { current_quantity: t.quantity, unit_price: t.unit_price },
        });
      }

      const allIds = Object.values(idByName);
      if (allIds.length) {
        await tx.product_supplier.createMany({
          data: allIds.map((id_product) => ({
            id_supplier: input.idSupplier,
            id_product,
          })),
        });
      }

      const movements = [
        ...input.newProducts.map((np) => ({
          id_product: idByName[np.name],
          quantity: np.quantity,
          type: 'ENTRADA',
          origin: 'COMPRA',
        })),
        ...input.topUps.map((t) => ({
          id_product: t.id_product,
          quantity: t.addQuantity,
          type: 'ENTRADA',
          origin: 'COMPRA',
        })),
      ];
      if (movements.length) {
        await tx.movement_stock.createMany({ data: movements });
      }

      return purchase;
    });
  }

  async getAllPurchases() {
    return await this.prisma.purchase.findMany({
      include: { purchase_items: { include: { product: true } } },
    });
  }

  async getPurchasesByIds(id: string) {
    return await this.prisma.purchase.findMany({
      where: { id_purchase: id },
      include: { purchase_items: { include: { product: true } } },
    });
  }

  async deletePurchase(id: string) {
    return await this.prisma.purchase.delete({
      where: { id_purchase: id },
    });
  }
}

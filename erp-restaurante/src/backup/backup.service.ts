import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface BackupData {
  users?: any[];
  products?: any[];
  suppliers?: any[];
  recipeDishes?: any[];
  dishes?: any[];
  purchases?: any[];
  purchaseItems?: any[];
  productSuppliers?: any[];
  movements?: any[];
  settings?: any[];
  logs?: any[];
}

@Injectable()
export class BackupService {
  constructor(private prisma: PrismaService) {}

  async export() {
    const [
      users,
      products,
      suppliers,
      recipeDishes,
      dishes,
      purchases,
      purchaseItems,
      productSuppliers,
      movements,
      settings,
      logs,
    ] = await Promise.all([
      this.prisma.user.findMany(),
      this.prisma.product.findMany(),
      this.prisma.supplier.findMany(),
      this.prisma.recipe_Dish.findMany(),
      this.prisma.dish.findMany(),
      this.prisma.purchase.findMany(),
      this.prisma.purchase_items.findMany(),
      this.prisma.product_supplier.findMany(),
      this.prisma.movement_stock.findMany(),
      this.prisma.setting.findMany(),
      this.prisma.log.findMany(),
    ]);

    return {
      _version: 1,
      exportedAt: new Date().toISOString(),
      users,
      products,
      suppliers,
      recipeDishes,
      dishes,
      purchases,
      purchaseItems,
      productSuppliers,
      movements,
      settings,
      logs,
    };
  }

  async restore(data: BackupData) {
    await this.prisma.$transaction(async (tx) => {
      // wipe (children first)
      await tx.dish.deleteMany();
      await tx.recipe_Dish.deleteMany();
      await tx.purchase_items.deleteMany();
      await tx.movement_stock.deleteMany();
      await tx.product_supplier.deleteMany();
      await tx.purchase.deleteMany();
      await tx.product.deleteMany();
      await tx.supplier.deleteMany();
      await tx.log.deleteMany();
      await tx.user.deleteMany();
      await tx.setting.deleteMany();

      // insert (parents first)
      if (data.settings?.length) await tx.setting.createMany({ data: data.settings });
      if (data.users?.length) await tx.user.createMany({ data: data.users });
      if (data.suppliers?.length) await tx.supplier.createMany({ data: data.suppliers });
      if (data.products?.length) await tx.product.createMany({ data: data.products });
      if (data.recipeDishes?.length) await tx.recipe_Dish.createMany({ data: data.recipeDishes });
      if (data.dishes?.length) await tx.dish.createMany({ data: data.dishes });
      if (data.purchases?.length) await tx.purchase.createMany({ data: data.purchases });
      if (data.purchaseItems?.length)
        await tx.purchase_items.createMany({ data: data.purchaseItems });
      if (data.productSuppliers?.length)
        await tx.product_supplier.createMany({ data: data.productSuppliers });
      if (data.movements?.length) await tx.movement_stock.createMany({ data: data.movements });
      if (data.logs?.length) await tx.log.createMany({ data: data.logs });
    });
    return { restored: true };
  }

  // "Virar o mês": apaga compras, movimentos de estoque e logs.
  // Mantém cardápio, estoque, fornecedores, usuários e configurações.
  async reset() {
    await this.prisma.$transaction([
      this.prisma.purchase_items.deleteMany(),
      this.prisma.movement_stock.deleteMany(),
      this.prisma.purchase.deleteMany(),
      this.prisma.log.deleteMany(),
    ]);
    return { reset: true };
  }
}

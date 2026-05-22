import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ProductRepository } from '../repository/product.repository';
import { CreateProductDto } from '../dto/createproduct.dto';
import { Product } from '@prisma/client';
import { ProductValidator } from '../domain/product.validator';

export interface PendingPurchasedItem {
  name: string;
  quantity: number;
  unit_measurement: string;
  cost: number;
  id_supplier: string | null;
  supplierName: string | null;
  purchaseCount: number;
}

@Injectable()
export class ProductUseCase {
  constructor(private productRepository: ProductRepository) {}

  // Aggregate purchase line items not yet promoted to stock, grouped by name:
  // average cost (custo médio), summed quantity, supplier from the most recent
  // purchase.
  async getPendingPurchasedItems(): Promise<PendingPurchasedItem[]> {
    const items = await this.productRepository.findPendingPurchaseItems();
    const byName = new Map<string, PendingPurchasedItem & { priceSum: number }>();

    for (const it of items) {
      const acc = byName.get(it.name);
      if (acc) {
        acc.quantity += it.quantity;
        acc.priceSum += it.unit_price;
        acc.purchaseCount += 1;
      } else {
        // items are ordered newest first, so the first seen is the latest.
        byName.set(it.name, {
          name: it.name,
          quantity: it.quantity,
          unit_measurement: it.unit_measurement,
          cost: 0,
          priceSum: it.unit_price,
          id_supplier: it.purchase?.supplier?.id_supplier ?? null,
          supplierName: it.purchase?.supplier?.name ?? null,
          purchaseCount: 1,
        });
      }
    }

    return [...byName.values()].map(({ priceSum, ...rest }) => ({
      ...rest,
      cost: rest.purchaseCount > 0 ? priceSum / rest.purchaseCount : 0,
    }));
  }

  private async getPendingByName(
    name: string,
  ): Promise<PendingPurchasedItem | null> {
    const all = await this.getPendingPurchasedItems();
    return all.find((p) => p.name === name) ?? null;
  }

  async execute(data: CreateProductDto): Promise<Product> {
    try {
      const name = data.name.trim().toLowerCase();
      ProductValidator.validateUnit(data.unit_measurement);

      const productExists = await this.productRepository.findByName(name);
      if (productExists) {
        throw new BadRequestException('Produto já existe');
      }

      // Cost (custo médio), initial quantity and supplier come from the
      // pending purchases of this item — the purchase is the source of truth.
      const pending = await this.getPendingByName(name);
      if (!pending) {
        throw new BadRequestException(
          'Nenhuma compra pendente encontrada para este item',
        );
      }

      const product = await this.productRepository.createProduct({
        name,
        unit_measurement: data.unit_measurement,
        current_quantity: pending.quantity,
        minimum_quantity: data.minimum_quantity,
        unit_price: pending.cost,
        selling_price: data.selling_price ?? null,
        type: data.type ?? 'INGREDIENTE',
        id_supplier: pending.id_supplier ?? undefined,
      });

      await this.productRepository.linkPurchaseItemsToProduct(
        name,
        product.id_product,
      );

      return product;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Erro inesperado');
    }
  }

  async getById(id: string): Promise<Product> {
    const product = await this.productRepository.findById(id);

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    return product;
  }

  async getAll(): Promise<Product[]> {
    return this.productRepository.findAll();
  }

  async update(id: string, data: CreateProductDto): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) throw new NotFoundException('Produto não encontrado');

    ProductValidator.validateUnit(data.unit_measurement);

    // Cost (unit_price) and stock quantity are owned by the purchase flow, not
    // manual edits — keep the persisted values. Only config fields change here.
    return this.productRepository.update(id, {
      name: data.name.trim().toLowerCase(),
      unit_measurement: data.unit_measurement,
      minimum_quantity: data.minimum_quantity,
      selling_price: data.selling_price ?? null,
      type: data.type ?? product.type,
      unit_price: product.unit_price,
      current_quantity: product.current_quantity,
    });
  }

  async delete(id: string): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) throw new NotFoundException('Produto não encontrado');
    return this.productRepository.deleteProduct(id);
  }
}

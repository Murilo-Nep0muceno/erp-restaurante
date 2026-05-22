import { UnitConverter } from '../domain/converter.unit.measurement';
import { PurchaseDto } from '../dto/purchase.dto';
import { PurchaseRepository } from '../repository/purchase.repository';
import { ConflictException, Injectable } from '@nestjs/common';
import crypto from 'crypto';

@Injectable()
export class PurchaseUseCase {
  constructor(private PurchaseRepository: PurchaseRepository) {}

  async execute(data: PurchaseDto) {
    const idSupplier = data.id_supplier;
    const dataCompra = data.date;

    // Items are free-text. Match each to an existing product by name; matched
    // items top up stock, unmatched ones stay "pending" (id_product null) and
    // become selectable when creating a stock item.
    const names = data.items.map((i) => i.name.trim().toLowerCase());
    const products = await this.PurchaseRepository.getProductsByNames(names);
    const productByName = new Map(products.map((p) => [p.name, p]));

    const lines = data.items.map((req) => {
      const name = req.name.trim().toLowerCase();
      const product = productByName.get(name) ?? null;

      // Convert to the product's stored unit only when topping up an existing
      // product in a different unit.
      const stockQuantity =
        product && req.unit_measurement !== product.unit_measurement
          ? UnitConverter.convert(
              req.quantity,
              req.unit_measurement,
              product.unit_measurement as any,
            )
          : req.quantity;

      return {
        name,
        unit_measurement: req.unit_measurement,
        quantity: req.quantity,
        unit_price: req.unit_price,
        id_product: product?.id_product ?? null,
        currentQuantity: product?.current_quantity ?? null,
        stockQuantity,
      };
    });

    const total = lines.reduce(
      (acc, l) => acc + l.unit_price * l.quantity,
      0,
    );

    const hash = await this.createHash(data, lines);

    const purchase = await this.PurchaseRepository.createPurchase({
      date: dataCompra,
      total_price: total,
      hash,
      supplier: { connect: { id_supplier: idSupplier } },
    });

    await this.PurchaseRepository.createManyPurchaseItems(
      lines.map((l) => ({
        id_purchase: purchase.id_purchase,
        id_product: l.id_product,
        name: l.name,
        unit_measurement: l.unit_measurement,
        quantity: l.quantity,
        unit_price: l.unit_price,
      })),
    );

    // Only matched products link to a supplier and have their stock topped up.
    const matched = lines.filter((l) => l.id_product);
    if (matched.length) {
      await this.PurchaseRepository.createManyProductSupplier(
        matched.map((l) => ({
          id_supplier: idSupplier,
          id_product: l.id_product as string,
        })),
      );

      // Aggregate increments per product so two lines of the same item in one
      // purchase don't overwrite each other.
      const incrementByProduct = new Map<string, number>();
      for (const l of matched) {
        const id = l.id_product as string;
        incrementByProduct.set(
          id,
          (incrementByProduct.get(id) ?? 0) + l.stockQuantity,
        );
      }
      const baseQuantity = new Map(
        matched.map((l) => [l.id_product as string, l.currentQuantity ?? 0]),
      );

      await this.PurchaseRepository.updateQuantityProduct(
        [...incrementByProduct].map(([id_product, increment]) => ({
          id_product,
          quantity: (baseQuantity.get(id_product) ?? 0) + increment,
        })),
      );
    }

    return {
      dataCompra,
      items: lines.map((l) => ({
        name: l.name,
        quantity: l.quantity,
        unitPrice: l.unit_price,
      })),
      hash,
      total,
    };
  }

  async createHash(
    data: PurchaseDto,
    items: { name: string; quantity: number; unit_price: number }[],
  ): Promise<string> {
    const hash = crypto
      .createHash('sha256')
      .update(
        JSON.stringify({
          supplier: data.id_supplier,
          date: data.date,
          items: items
            .map((i) => ({
              name: i.name,
              quantity: i.quantity,
              price: i.unit_price,
            }))
            .sort((a, b) => a.name.localeCompare(b.name)),
        }),
      )
      .digest('hex');

    const exists = await this.PurchaseRepository.findByHash(hash);

    if (exists) {
      throw new ConflictException('Compra duplicada');
    }

    return hash;
  }

  async getAllPurchases() {
    return await this.PurchaseRepository.getAllPurchases();
  }

  async getById(id: string) {
    return await this.PurchaseRepository.getPurchasesByIds(id);
  }

  async delete(id: string) {
    return await this.PurchaseRepository.deletePurchase(id);
  }
}

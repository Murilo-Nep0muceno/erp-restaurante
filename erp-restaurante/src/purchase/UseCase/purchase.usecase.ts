import { UnitConverter } from '../domain/converter.unit.measurement';
import { PurchaseDto } from '../dto/purchase.dto';
import {
  NewProductInput,
  PurchaseRepository,
  TopUpInput,
} from '../repository/purchase.repository';
import { weightedAverageCost } from '../../product/domain/cost';
import { ConflictException, Injectable } from '@nestjs/common';
import crypto from 'crypto';

@Injectable()
export class PurchaseUseCase {
  constructor(private PurchaseRepository: PurchaseRepository) {}

  async execute(data: PurchaseDto) {
    const idSupplier = data.id_supplier;
    const date = data.date;

    // Registro fiel da compra: nomes normalizados, unidade/qtd/preço como
    // digitados.
    const items = data.items.map((i) => ({
      name: i.name.trim().toLowerCase(),
      unit_measurement: i.unit_measurement,
      quantity: i.quantity,
      unit_price: i.unit_price,
    }));

    const total = items.reduce((acc, l) => acc + l.unit_price * l.quantity, 0);
    const hash = await this.createHash(data, items);

    const names = items.map((i) => i.name);
    const existing = await this.PurchaseRepository.getProductsByNames(names);
    const existingByName = new Map(existing.map((p) => [p.name, p]));

    // Agrega por nome convertendo para a unidade base do produto. O custo é
    // somado em dinheiro (agnóstico de unidade) e dividido pela qtd em base.
    const groups = new Map<
      string,
      { base: string; qtyBase: number; cost: number }
    >();
    for (const it of items) {
      const ex = existingByName.get(it.name);
      const base = ex ? ex.unit_measurement : it.unit_measurement;
      const qtyBase = UnitConverter.safeConvert(
        it.quantity,
        it.unit_measurement,
        base,
      );
      const lineCost = it.unit_price * it.quantity;
      const g = groups.get(it.name);
      if (g) {
        g.qtyBase += qtyBase;
        g.cost += lineCost;
      } else {
        groups.set(it.name, { base, qtyBase, cost: lineCost });
      }
    }

    const newProducts: NewProductInput[] = [];
    const topUps: TopUpInput[] = [];
    const existingIdByName: Record<string, string> = {};

    for (const [name, g] of groups) {
      const incomingCost = g.qtyBase > 0 ? g.cost / g.qtyBase : 0;
      const ex = existingByName.get(name);
      if (ex) {
        existingIdByName[name] = ex.id_product;
        topUps.push({
          id_product: ex.id_product,
          quantity: ex.current_quantity + g.qtyBase,
          unit_price: weightedAverageCost(
            ex.current_quantity,
            ex.unit_price,
            g.qtyBase,
            incomingCost,
          ),
          addQuantity: g.qtyBase,
        });
      } else {
        newProducts.push({
          name,
          unit_measurement: g.base,
          quantity: g.qtyBase,
          unit_price: incomingCost,
        });
      }
    }

    await this.PurchaseRepository.commitPurchase({
      idSupplier,
      date,
      total,
      hash,
      newProducts,
      topUps,
      items,
      existingIdByName,
    });

    return {
      dataCompra: date,
      items: items.map((l) => ({
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

import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ProductRepository } from '../repository/product.repository';
import { CreateProductDto } from '../dto/createproduct.dto';
import { Product } from '@prisma/client';
import { ProductValidator } from '../domain/product.validator';
import { weightedAverageCost } from '../domain/cost';

@Injectable()
export class ProductUseCase {
  constructor(private productRepository: ProductRepository) {}

  // Cadastro direto no catálogo (Fluxo A): sem compra, sem fornecedor
  // obrigatório. Se o nome já existe, soma ao estoque do item existente
  // (top-up) recalculando o custo médio.
  async execute(data: CreateProductDto): Promise<Product> {
    try {
      const name = data.name.trim().toLowerCase();
      ProductValidator.validateUnit(data.unit_measurement);

      const qty = data.current_quantity ?? 0;
      const cost = data.unit_price ?? null;

      const existing = await this.productRepository.findByName(name);
      if (existing) {
        return this.topUpExisting(existing, qty, cost, data.id_supplier);
      }

      const product = await this.productRepository.createProduct({
        name,
        unit_measurement: data.unit_measurement,
        current_quantity: qty,
        minimum_quantity: data.minimum_quantity ?? 0,
        unit_price: cost,
        selling_price: data.selling_price ?? null,
        type: data.type ?? 'INGREDIENTE',
        notes: data.notes ?? null,
        expiry_date: data.expiry_date ?? null,
        id_supplier: data.id_supplier ?? undefined,
      });

      if (qty > 0) {
        await this.productRepository.createMovement({
          id_product: product.id_product,
          quantity: qty,
          type: 'ENTRADA',
          origin: 'CADASTRO_INICIAL',
        });
      }

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

  private async topUpExisting(
    existing: Product,
    qty: number,
    cost: number | null,
    id_supplier?: string,
  ): Promise<Product> {
    if (qty <= 0) {
      // Nada a somar — só vincula fornecedor padrão se ainda não houver.
      if (id_supplier && !existing.id_supplier) {
        return this.productRepository.setDefaultSupplier(
          existing.id_product,
          id_supplier,
        );
      }
      return existing;
    }

    const newCost = weightedAverageCost(
      existing.current_quantity,
      existing.unit_price,
      qty,
      cost,
    );

    const updated = await this.productRepository.update(existing.id_product, {
      current_quantity: existing.current_quantity + qty,
      unit_price: newCost,
      id_supplier: id_supplier ?? existing.id_supplier ?? undefined,
    });

    await this.productRepository.createMovement({
      id_product: existing.id_product,
      quantity: qty,
      type: 'ENTRADA',
      origin: 'AJUSTE',
    });

    return updated;
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

    // Custo (unit_price) e saldo (current_quantity) pertencem ao fluxo de
    // entrada (compra / cadastro), não à edição manual — preserva-os. Aqui só
    // mudam os campos de configuração.
    return this.productRepository.update(id, {
      name: data.name.trim().toLowerCase(),
      unit_measurement: data.unit_measurement,
      minimum_quantity: data.minimum_quantity ?? product.minimum_quantity,
      selling_price: data.selling_price ?? null,
      type: data.type ?? product.type,
      notes: data.notes ?? product.notes,
      expiry_date: data.expiry_date ?? null,
      unit_price: product.unit_price,
      current_quantity: product.current_quantity,
    });
  }

  async delete(id: string, removeFromDishes = false): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) throw new NotFoundException('Produto não encontrado');

    // Itens em uso numa ficha técnica têm vínculo obrigatório no prato. Sem
    // confirmação explícita, devolvemos 409 + a lista de pratos para o front
    // perguntar se o usuário quer remover o ingrediente das fichas.
    if (!removeFromDishes) {
      const dishes = await this.productRepository.findDishesUsingProduct(id);
      if (dishes.length > 0) {
        throw new ConflictException({
          statusCode: 409,
          code: 'PRODUCT_IN_DISHES',
          message: 'O item faz parte de um ou mais pratos do cardápio.',
          dishes,
        });
      }
    }

    return this.productRepository.deleteProduct(id, removeFromDishes);
  }
}

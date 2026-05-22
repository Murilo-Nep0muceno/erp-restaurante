import { Injectable } from '@nestjs/common';
import { Prisma, Product, Recipe_Dish } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRecipeDishRepository } from '../interface/recipe_dish.repository.interface';
import { CreateDishRepository } from '../interface/dish.items.repository.interface';

@Injectable()
export class RecipeDishRepository {
  constructor(
    private prisma: PrismaService,
    private readonly prismaService: PrismaService,
  ) {}

  async findProductById(idProduct: string[]): Promise<Product[]> {
    const productId = await this.prisma.product.findMany({
      where: {
        id_product: {
          in: idProduct,
        },
      },
    });
    return productId;
  }

  async findDishByName(nameDish: string): Promise<Recipe_Dish | null> {
    const findDishByName = await this.prisma.recipe_Dish.findFirst({
      where: {
        name_dish: nameDish,
      },
    });
    return findDishByName;
  }
  async findDishByNameAndId(
    nameDish: string,
    id: string,
  ): Promise<Recipe_Dish | null> {
    const findDishByName = await this.prisma.recipe_Dish.findFirst({
      where: {
        name_dish: nameDish,
        NOT: {
          id_recipe_dish: id,
        },
      },
    });
    return findDishByName;
  }

  async findRecipeByIdDish(
    id_recipe_dish: string,
  ): Promise<
    { id_product: string; quantity: number; unit_measurement: string }[]
  > {
    const findRecipeByIdDish = await this.prisma.dish.findMany({
      where: { id_recipe_dish },
      select: {
        id_product: true,
        quantity: true,
        unit_measurement: true,
      },
    });
    return findRecipeByIdDish;
  }

  async createRecipeDish(
    data: CreateRecipeDishRepository,
    tx: Prisma.TransactionClient,
  ) {
    return await tx.recipe_Dish.create({
      data: {
        name_dish: data.nameDish,
        description_dish: data.descriptionDish,
        selling_price_dish: data.sellingPriceDish,
        available_dish: data.availableDish,
        image: data.image ?? null,
        category: data.category ?? null,
        serves: data.serves ?? null,
        control_rule: data.controlRule ?? null,
      },
    });
  }

  async updateRecipeDish(
    id: string,
    data: CreateRecipeDishRepository,
    dishes: CreateDishRepository[],
  ) {
    return await this.prismaService.$transaction(async (tx) => {
      await tx.dish.deleteMany({ where: { id_recipe_dish: id } });
      const recipe = await tx.recipe_Dish.update({
        where: { id_recipe_dish: id },
        data: {
          name_dish: data.nameDish,
          description_dish: data.descriptionDish,
          selling_price_dish: data.sellingPriceDish,
          available_dish: data.availableDish,
          image: data.image ?? null,
          category: data.category ?? null,
          serves: data.serves ?? null,
          control_rule: data.controlRule ?? null,
        },
      });
      if (dishes.length) {
        await tx.dish.createMany({
          data: dishes.map((item) => ({
            id_recipe_dish: id,
            id_product: item.idProduct,
            quantity: item.quantityProduct,
            unit_measurement: item.unitMeasurement,
          })),
        });
      }
      return recipe;
    });
  }
  async createDish(
    idRecipeDish: string,
    product: CreateDishRepository[],
    tx: Prisma.TransactionClient,
  ) {
    return await tx.dish.createMany({
      data: product.map((item) => ({
        id_recipe_dish: idRecipeDish,
        id_product: item.idProduct,
        quantity: item.quantityProduct,
        unit_measurement: item.unitMeasurement,
      })),
    });
  }
  async getAll(): Promise<Recipe_Dish[]> {
    const recipeDish = await this.prisma.recipe_Dish.findMany({
      include: {
        dish: { include: { product: true } },
      },
    });
    return recipeDish;
  }

  // Menu público: apenas pratos disponíveis e campos seguros (sem a ficha
  // técnica/produtos, que carregam custos internos).
  async getPublic() {
    return this.prisma.recipe_Dish.findMany({
      where: { available_dish: true },
      select: {
        id_recipe_dish: true,
        name_dish: true,
        description_dish: true,
        selling_price_dish: true,
        available_dish: true,
        image: true,
        category: true,
        serves: true,
      },
      orderBy: { name_dish: 'asc' },
    });
  }
  async findById(id: string) {
    const recipeDish = await this.prisma.recipe_Dish.findUnique({
      where: {
        id_recipe_dish: id,
      },
      include: {
        dish: { include: { product: true } },
      },
    });
    return recipeDish;
  }

  async delete(id: string): Promise<Recipe_Dish | void> {
    const deleteDish = await this.prismaService.$transaction(async (tx) => {
      await tx.dish.deleteMany({
        where: {
          id_recipe_dish: id,
        },
      });
      await tx.recipe_Dish.delete({
        where: {
          id_recipe_dish: id,
        },
      });
    });
    return deleteDish;
  }
}

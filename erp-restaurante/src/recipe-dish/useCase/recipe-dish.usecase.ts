import { ConflictException, Injectable } from '@nestjs/common';
import { RecipeDishRepository } from '../repository/recipe-dish.repository';
import { recipeDishDto } from '../dto/recipe-dish.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDishRepository } from '../interface/dish.items.repository.interface';
import { Product } from '@prisma/client';
@Injectable()
export class RecipeDishUseCase {
  constructor(
    private RecipeDishRepository: RecipeDishRepository,
    private readonly prismaService: PrismaService,
  ) {}

  private async findIfExistsProductById(
    products: CreateDishRepository[],
  ): Promise<Product[] | null> {
    const idProduct = products.map((i) => i.idProduct);

    const findProductbyId =
      await this.RecipeDishRepository.findProductById(idProduct);

    if (findProductbyId.length !== idProduct.length) {
      const foundIds = findProductbyId.map((p) => p.id_product);
      const missingIds = idProduct.filter((id) => !foundIds.includes(id));
      throw new ConflictException(
        `Os seguintes produtos não existem: ${missingIds.join(', ')}`,
      );
    }
    return findProductbyId;
  }

  async create(data: recipeDishDto) {
    const product: CreateDishRepository[] = data.dishes.map((i) => ({
      idProduct: i.id_product,
      quantityProduct: i.quantity,
      unitMeasurement: i.unit_measurement,
    }));
    const idProduct = product.map((i) => i.idProduct);
    const findProductbyId =
      await this.RecipeDishRepository.findProductById(idProduct);

    if (findProductbyId.length !== idProduct.length) {
      const foundIds = findProductbyId.map((p) => p.id_product);

      const missingIds = idProduct.filter((id) => !foundIds.includes(id));

      throw new ConflictException(
        `Os seguintes produtos não existem: ${missingIds.join(', ')}`,
      );
    }

    const insertRecipeDish = {
      nameDish: data.name_dish,
      descriptionDish: data.description_dish,
      sellingPriceDish: data.selling_price_dish,
      availableDish: data.available_dish,
      image: data.image,
      category: data.category,
      serves: data.serves,
      controlRule: data.control_rule,
    };
    const dishAlreadyExists = await this.RecipeDishRepository.findDishByName(
      insertRecipeDish.nameDish,
    );

    if (dishAlreadyExists) {
      const currentRecipeDish =
        await this.RecipeDishRepository.findRecipeByIdDish(
          dishAlreadyExists.id_recipe_dish,
        );

      const newRecipe = product
        .map((i) => ({
          id_product: i.idProduct,
          quantity: i.quantityProduct,
          unit_measurement: i.unitMeasurement,
        }))
        .sort((a, b) => a.id_product.localeCompare(b.id_product));

      const existingRecipe = currentRecipeDish
        .map((i) => ({
          id_product: i.id_product,
          quantity: i.quantity,
          unit_measurement: i.unit_measurement,
        }))
        .sort((a, b) => a.id_product.localeCompare(b.id_product));

      const sameRecipe =
        JSON.stringify(newRecipe) === JSON.stringify(existingRecipe);

      if (sameRecipe) {
        throw new ConflictException(
          'Já existe um prato com o mesmo nome e receita',
        );
      }
      throw new ConflictException('Já existe um prato com esse nome');
    }

    const createRecipeDish = await this.prismaService.$transaction(
      async (tx) => {
        const recipeDish = await this.RecipeDishRepository.createRecipeDish(
          insertRecipeDish,
          tx,
        );

        await this.RecipeDishRepository.createDish(
          recipeDish.id_recipe_dish,
          product,
          tx,
        );

        return {
          recipeDish,
          product,
        };
      },
    );
    return {
      createRecipeDish,
    };
  }

  async getAll() {
    const recipeDish = await this.RecipeDishRepository.getAll();
    if (!recipeDish) throw new ConflictException('Nenhum prato encontrado');

    return recipeDish;
  }

  async getPublic() {
    return this.RecipeDishRepository.getPublic();
  }
  async findById(id: string) {
    const findRecipeDish = await this.RecipeDishRepository.findById(id);
    if (!findRecipeDish) throw new ConflictException('Prato não encontrado');
    return findRecipeDish;
  }

  async update(id: string, data: recipeDishDto) {
    const products = data.dishes.map((i) => ({
      idProduct: i.id_product,
      quantityProduct: i.quantity,
      unitMeasurement: i.unit_measurement,
    }));

    await this.findIfExistsProductById(products);

    const insertRecipeDish = {
      nameDish: data.name_dish,
      descriptionDish: data.description_dish,
      sellingPriceDish: data.selling_price_dish,
      availableDish: data.available_dish,
      image: data.image,
      category: data.category,
      serves: data.serves,
      controlRule: data.control_rule,
    };

    const findRecipeDish = await this.RecipeDishRepository.findById(id);
    if (!findRecipeDish) throw new ConflictException('Prato não encontrado');

    const dishAlreadyExists =
      await this.RecipeDishRepository.findDishByNameAndId(
        insertRecipeDish.nameDish,
        id,
      );

    if (dishAlreadyExists)
      throw new ConflictException('Já existe um prato com esse nome');

    return this.RecipeDishRepository.updateRecipeDish(
      id,
      insertRecipeDish,
      products,
    );
  }

  async delete(id: string) {
    const findRecipeDish = await this.RecipeDishRepository.findById(id);
    if (!findRecipeDish) throw new ConflictException('Prato não encontrado');
    const recipeDish = await this.RecipeDishRepository.delete(id);
    return {
      message: 'Prato deletado com sucesso',
      recipeDish,
    };
  }
}

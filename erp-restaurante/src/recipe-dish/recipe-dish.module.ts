import { Module } from '@nestjs/common';
import { RecipeDishController } from './recipe-dish.controller';
import { RecipeDishUseCase } from './useCase/recipe-dish.usecase';
import { PrismaService } from 'src/prisma/prisma.service';
import { RecipeDishRepository } from './repository/recipe-dish.repository';

@Module({
  controllers: [RecipeDishController],
  providers: [RecipeDishUseCase, RecipeDishRepository, PrismaService],
  exports: [RecipeDishRepository],
})
export class RecipeDishModule {}

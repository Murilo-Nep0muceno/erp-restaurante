import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductRepository } from './repository/product.repository';
import { ProductUseCase } from './useCases/product.usecase';
import { PrismaService } from 'src/prisma/prisma.service';
@Module({
  controllers: [ProductController],
  providers: [ProductUseCase, ProductRepository, PrismaService],
  exports: [ProductRepository],
})
export class ProductModule {}

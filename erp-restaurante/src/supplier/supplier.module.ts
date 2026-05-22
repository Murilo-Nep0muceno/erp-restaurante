import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SupplierRepository } from './repository/supplier.repository';
import { SupplierController } from './supplier.controller';
import { SupplierUseCase } from './useCase/supplier.usecase';

@Module({
  controllers: [SupplierController],
  providers: [SupplierUseCase, SupplierRepository, PrismaService],
  exports: [SupplierRepository],
})
export class SupplierModule {}

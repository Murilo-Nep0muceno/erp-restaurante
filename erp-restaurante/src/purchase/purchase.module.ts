import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PurchaseController } from './purchase.controller';
import { PurchaseRepository } from './repository/purchase.repository';
import { PurchaseUseCase } from './UseCase/purchase.usecase';

@Module({
  controllers: [PurchaseController],
  providers: [PurchaseUseCase, PurchaseRepository, PrismaService],
  exports: [PurchaseRepository],
})
export class PurchaseModule {}

import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderController } from './order.controller';
import { OrderUseCase } from './order.usecase';
import { OrderRepository } from './repository/order.repository';

@Module({
  controllers: [OrderController],
  providers: [OrderUseCase, OrderRepository, PrismaService],
})
export class OrderModule {}

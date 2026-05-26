import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class OrderRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.OrderCreateInput) {
    return this.prisma.order.create({ data, include: { items: true } });
  }

  async findAll() {
    return this.prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.order.findUnique({ where: { id_order: id } });
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.order.update({
      where: { id_order: id },
      data: { status },
      include: { items: true },
    });
  }

  async countPending() {
    return this.prisma.order.count({
      where: { status: { in: ['new', 'cooking'] } },
    });
  }

  async countOpenForTable(tableNum: number) {
    return this.prisma.order.count({
      where: { tableNum, status: { not: 'delivered' } },
    });
  }

  async moveTable(from: number, to: number) {
    return this.prisma.order.updateMany({
      where: { tableNum: from, status: { not: 'delivered' } },
      data: { tableNum: to },
    });
  }

  async closeTable(tableNum: number) {
    return this.prisma.order.updateMany({
      where: { tableNum, status: { not: 'delivered' } },
      data: { status: 'delivered' },
    });
  }

  async getKitchen() {
    const setting = await this.prisma.setting.upsert({
      where: { id: 'singleton' },
      update: {},
      create: { id: 'singleton' },
    });
    return { closed: setting.kitchenClosed, closedAt: setting.kitchenClosedAt };
  }

  async setKitchen(closed: boolean) {
    const setting = await this.prisma.setting.upsert({
      where: { id: 'singleton' },
      update: {
        kitchenClosed: closed,
        kitchenClosedAt: closed ? new Date() : null,
      },
      create: {
        id: 'singleton',
        kitchenClosed: closed,
        kitchenClosedAt: closed ? new Date() : null,
      },
    });
    return { closed: setting.kitchenClosed, closedAt: setting.kitchenClosedAt };
  }
}

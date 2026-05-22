import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderRepository } from './repository/order.repository';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrderUseCase {
  constructor(private orderRepository: OrderRepository) {}

  async create(data: CreateOrderDto) {
    const kitchen = await this.orderRepository.getKitchen();
    if (kitchen.closed) {
      throw new ConflictException(
        'A cozinha está fechada — não é possível enviar novos pedidos.',
      );
    }
    const code = String(Math.floor(1000 + Math.random() * 9000));
    return this.orderRepository.create({
      code,
      tableNum: data.tableNum,
      status: 'new',
      items: {
        create: data.items.map((i) => ({
          dishId: i.dishId,
          name: i.name,
          price: i.price,
          qty: i.qty,
          notes: i.notes,
        })),
      },
    });
  }

  async getAll() {
    return this.orderRepository.findAll();
  }

  async updateStatus(id: string, status: string) {
    const order = await this.orderRepository.findById(id);
    if (!order) throw new NotFoundException('Pedido não encontrado');
    return this.orderRepository.updateStatus(id, status);
  }

  async getKitchen() {
    return this.orderRepository.getKitchen();
  }

  async closeKitchen() {
    const pending = await this.orderRepository.countPending();
    if (pending > 0) {
      throw new ConflictException(
        `Há ${pending} pedido(s) em aberto (Novos/Preparando). Finalize todos antes de fechar a cozinha.`,
      );
    }
    return this.orderRepository.setKitchen(true);
  }

  async openKitchen() {
    return this.orderRepository.setKitchen(false);
  }

  async moveTable(from: number, to: number) {
    if (from === to) {
      throw new ConflictException('A mesa de origem e destino são a mesma.');
    }
    const open = await this.orderRepository.countOpenForTable(from);
    if (open === 0) {
      throw new ConflictException('A mesa de origem não tem comanda aberta.');
    }
    await this.orderRepository.moveTable(from, to);
    return { moved: open, from, to };
  }

  async closeTable(tableNum: number) {
    const result = await this.orderRepository.closeTable(tableNum);
    return { closed: result.count, tableNum };
  }
}

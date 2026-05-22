import api from './api';
import type { Order, OrderItem, OrderStatus } from '../types';

// Backend shape (Prisma): id_order/code/tableNum/status/createdAt + items.
interface ApiOrderItem {
  dishId?: string | null;
  name: string;
  price: number;
  qty: number;
  notes?: string | null;
}
interface ApiOrder {
  id_order: string;
  code: string;
  tableNum: number;
  status: OrderStatus;
  createdAt: string;
  items: ApiOrderItem[];
}

function toOrder(o: ApiOrder): Order {
  return {
    id: o.id_order,
    code: o.code,
    tableNum: o.tableNum,
    status: o.status,
    createdAt: o.createdAt,
    items: (o.items ?? []).map(
      (it): OrderItem => ({
        dishId: it.dishId ?? '',
        name: it.name,
        price: it.price,
        qty: it.qty,
        notes: it.notes ?? undefined,
      }),
    ),
  };
}

export async function getOrders(): Promise<Order[]> {
  const { data } = await api.get<ApiOrder[]>('/order');
  return data.map(toOrder);
}

export async function createOrder(input: {
  tableNum: number;
  items: OrderItem[];
}): Promise<Order> {
  const payload = {
    tableNum: input.tableNum,
    items: input.items.map((it) => ({
      dishId: it.dishId || undefined,
      name: it.name,
      price: it.price,
      qty: it.qty,
      notes: it.notes || undefined,
    })),
  };
  const { data } = await api.post<ApiOrder>('/order', payload);
  return toOrder(data);
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  const { data } = await api.patch<ApiOrder>(`/order/${id}/status`, { status });
  return toOrder(data);
}

export interface KitchenState {
  closed: boolean;
  closedAt: string | null;
}

export async function getKitchenState(): Promise<KitchenState> {
  const { data } = await api.get<KitchenState>('/order/kitchen');
  return data;
}

export async function closeKitchen(): Promise<KitchenState> {
  const { data } = await api.post<KitchenState>('/order/kitchen/close');
  return data;
}

export async function openKitchen(): Promise<KitchenState> {
  const { data } = await api.post<KitchenState>('/order/kitchen/open');
  return data;
}

export async function moveTable(from: number, to: number): Promise<void> {
  await api.patch('/order/move-table', { from, to });
}

export async function closeTable(tableNum: number): Promise<void> {
  await api.patch('/order/close-table', { tableNum });
}

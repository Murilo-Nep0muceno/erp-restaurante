import type { Order } from '../types';

export interface BestSellerRow {
  name: string;
  qty: number;
  revenue: number;
}

// Aggregates dishes sold across all orders (the mock order flow), ranked by qty.
export function computeBestSellers(orders: Order[]): BestSellerRow[] {
  const map = new Map<string, BestSellerRow>();
  for (const order of orders) {
    for (const item of order.items) {
      const current = map.get(item.name) ?? { name: item.name, qty: 0, revenue: 0 };
      current.qty += item.qty;
      current.revenue += item.qty * item.price;
      map.set(item.name, current);
    }
  }
  return [...map.values()].sort((a, b) => b.qty - a.qty);
}

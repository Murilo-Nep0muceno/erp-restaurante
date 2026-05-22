import { createContext, useContext } from 'react';
import type { Order, OrderItem, OrderStatus, RestaurantTable } from '../types';

export type CartLine = OrderItem;

export interface OrderContextValue {
  tables: RestaurantTable[];
  orders: Order[];
  kitchenClosed: boolean;
  kitchenClosedAt: string | null;
  selectedTable: number | null;
  cart: CartLine[];
  selectTable: (num: number | null) => void;
  addToCart: (dish: { dishId: string; name: string; price: number }) => void;
  changeQty: (dishId: string, delta: number) => void;
  setNotes: (dishId: string, notes: string) => void;
  removeFromCart: (dishId: string) => void;
  clearCart: () => void;
  submitOrder: () => Promise<boolean>;
  advanceOrder: (orderId: string) => Promise<void>;
  moveOrder: (orderId: string, status: OrderStatus) => Promise<void>;
  closeKitchen: () => Promise<{ ok: boolean; message?: string }>;
  openKitchen: () => Promise<void>;
  moveTable: (from: number, to: number) => Promise<{ ok: boolean; message?: string }>;
  closeTable: (tableNum: number) => Promise<void>;
  addTable: () => void;
  removeTable: (num: number) => void;
}

export const OrderContext = createContext<OrderContextValue | null>(null);

export function useOrders(): OrderContextValue {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error('useOrders deve ser usado dentro de <OrderProvider>');
  return ctx;
}

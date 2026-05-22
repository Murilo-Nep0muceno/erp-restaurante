import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { OrderContext } from './orderContext';
import type { CartLine } from './orderContext';
import type { Order, OrderStatus, RestaurantTable } from '../types';
import { isAxiosError } from 'axios';
import { TOKEN_KEY } from '../services/api';
import {
  closeKitchen as apiCloseKitchen,
  closeTable as apiCloseTable,
  createOrder,
  getKitchenState,
  getOrders,
  moveTable as apiMoveTable,
  openKitchen as apiOpenKitchen,
  updateOrderStatus,
} from '../services/order.service';

// Tables remain client-side (localStorage); orders are persisted in the
// backend so the kitchen sees them across devices.
const TABLES_KEY = 'epicurean_mock_tables';
const TABLE_COUNT = 12;
const POLL_MS = 5000;

const NEXT_STATUS: Record<OrderStatus, OrderStatus> = {
  new: 'cooking',
  cooking: 'ready',
  ready: 'delivered',
  delivered: 'delivered',
};

function load<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function initialTables(): RestaurantTable[] {
  return Array.from({ length: TABLE_COUNT }, (_, i) => ({
    num: i + 1,
    status: 'free' as const,
    orderId: null,
  }));
}

export function OrderProvider({ children }: { children: ReactNode }) {
  const [tables, setTables] = useState<RestaurantTable[]>(() =>
    load(TABLES_KEY, initialTables()),
  );
  const [orders, setOrders] = useState<Order[]>([]);
  const [kitchenClosed, setKitchenClosed] = useState(false);
  const [kitchenClosedAt, setKitchenClosedAt] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);

  useEffect(() => {
    localStorage.setItem(TABLES_KEY, JSON.stringify(tables));
  }, [tables]);

  // Cross-tab sync for the tables map only.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === TABLES_KEY && e.newValue) setTables(JSON.parse(e.newValue));
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Pull orders from the backend and poll, so the kitchen (and waiter) stay in
  // sync. Skip when there's no token (public/login pages).
  const reloadOrders = useCallback(async () => {
    if (!localStorage.getItem(TOKEN_KEY)) return;
    try {
      const [list, kitchen] = await Promise.all([getOrders(), getKitchenState()]);
      setOrders(list);
      setKitchenClosed(kitchen.closed);
      setKitchenClosedAt(kitchen.closedAt);
    } catch {
      /* keep last known state on a transient failure */
    }
  }, []);

  useEffect(() => {
    void reloadOrders();
    const id = setInterval(() => void reloadOrders(), POLL_MS);
    return () => clearInterval(id);
  }, [reloadOrders]);

  const selectTable = useCallback((num: number | null) => {
    setSelectedTable(num);
    setCart([]);
  }, []);

  const addToCart = useCallback((dish: { dishId: string; name: string; price: number }) => {
    setCart((prev) => {
      const existing = prev.find((l) => l.dishId === dish.dishId);
      if (existing) {
        return prev.map((l) => (l.dishId === dish.dishId ? { ...l, qty: l.qty + 1 } : l));
      }
      return [...prev, { ...dish, qty: 1 }];
    });
  }, []);

  const changeQty = useCallback((dishId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((l) => (l.dishId === dishId ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0),
    );
  }, []);

  const setNotes = useCallback((dishId: string, notes: string) => {
    setCart((prev) => prev.map((l) => (l.dishId === dishId ? { ...l, notes } : l)));
  }, []);

  const removeFromCart = useCallback((dishId: string) => {
    setCart((prev) => prev.filter((l) => l.dishId !== dishId));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const submitOrder = useCallback(async () => {
    if (selectedTable == null || cart.length === 0) return false;
    await createOrder({ tableNum: selectedTable, items: cart });
    // Mantém a mesa aberta: o pedido enviado vai para "já pedido" e o carrinho
    // de novos itens fica vazio para um próximo envio.
    setCart([]);
    await reloadOrders();
    return true;
  }, [selectedTable, cart, reloadOrders]);

  const addTable = useCallback(() => {
    setTables((prev) => {
      const nextNum = prev.reduce((max, t) => Math.max(max, t.num), 0) + 1;
      return [...prev, { num: nextNum, status: 'free' as const, orderId: null }];
    });
  }, []);

  const removeTable = useCallback((num: number) => {
    setTables((prev) => prev.filter((t) => t.num !== num));
    setSelectedTable((cur) => (cur === num ? null : cur));
  }, []);

  const moveOrder = useCallback(
    async (orderId: string, status: OrderStatus) => {
      const order = orders.find((o) => o.id === orderId);
      if (!order || order.status === status) return;
      // Optimistic update, then persist + refresh.
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o)),
      );
      try {
        await updateOrderStatus(orderId, status);
      } finally {
        await reloadOrders();
      }
    },
    [orders, reloadOrders],
  );

  const advanceOrder = useCallback(
    async (orderId: string) => {
      const order = orders.find((o) => o.id === orderId);
      if (!order) return;
      await moveOrder(orderId, NEXT_STATUS[order.status]);
    },
    [orders, moveOrder],
  );

  const closeKitchen = useCallback(async () => {
    try {
      const state = await apiCloseKitchen();
      setKitchenClosed(state.closed);
      setKitchenClosedAt(state.closedAt);
      return { ok: true };
    } catch (err) {
      const message = isAxiosError(err)
        ? (err.response?.data as { message?: string })?.message
        : undefined;
      return { ok: false, message };
    }
  }, []);

  const openKitchen = useCallback(async () => {
    const state = await apiOpenKitchen();
    setKitchenClosed(state.closed);
    setKitchenClosedAt(state.closedAt);
  }, []);

  const moveTable = useCallback(
    async (from: number, to: number) => {
      try {
        await apiMoveTable(from, to);
        await reloadOrders();
        return { ok: true };
      } catch (err) {
        const message = isAxiosError(err)
          ? (err.response?.data as { message?: string })?.message
          : undefined;
        return { ok: false, message };
      }
    },
    [reloadOrders],
  );

  const closeTable = useCallback(
    async (tableNum: number) => {
      await apiCloseTable(tableNum);
      await reloadOrders();
    },
    [reloadOrders],
  );

  const value = useMemo(
    () => ({
      tables,
      orders,
      kitchenClosed,
      kitchenClosedAt,
      selectedTable,
      cart,
      selectTable,
      addToCart,
      changeQty,
      setNotes,
      removeFromCart,
      clearCart,
      submitOrder,
      advanceOrder,
      moveOrder,
      closeKitchen,
      openKitchen,
      moveTable,
      closeTable,
      addTable,
      removeTable,
    }),
    [
      tables,
      orders,
      kitchenClosed,
      kitchenClosedAt,
      selectedTable,
      cart,
      selectTable,
      addToCart,
      changeQty,
      setNotes,
      removeFromCart,
      clearCart,
      submitOrder,
      advanceOrder,
      moveOrder,
      closeKitchen,
      openKitchen,
      moveTable,
      closeTable,
      addTable,
      removeTable,
    ],
  );

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

import api from './api';
import type { Purchase, CreatePurchaseInput } from '../types';

export async function getPurchases(): Promise<Purchase[]> {
  const { data } = await api.get<Purchase[]>('/purchase');
  return data;
}

export async function createPurchase(input: CreatePurchaseInput): Promise<Purchase> {
  const { data } = await api.post<Purchase>('/purchase', input);
  return data;
}

export async function deletePurchase(id: string): Promise<void> {
  await api.delete(`/purchase/${id}`);
}

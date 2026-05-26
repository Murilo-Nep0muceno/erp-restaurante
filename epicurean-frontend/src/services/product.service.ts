import api from './api';
import type { Product, CreateProductInput } from '../types';

export async function getProducts(): Promise<Product[]> {
  const { data } = await api.get<Product[]>('/product');
  return data;
}

export async function getProduct(id: string): Promise<Product> {
  const { data } = await api.get<Product>(`/product/${id}`);
  return data;
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  const { data } = await api.post<Product>('/product', input);
  return data;
}

export async function updateProduct(id: string, input: CreateProductInput): Promise<Product> {
  const { data } = await api.put<Product>(`/product/${id}`, input);
  return data;
}

export async function deleteProduct(id: string, removeFromDishes = false): Promise<void> {
  await api.delete(`/product/${id}`, {
    params: removeFromDishes ? { removeFromDishes: 'true' } : undefined,
  });
}

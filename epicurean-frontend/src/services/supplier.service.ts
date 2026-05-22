import api from './api';
import type { Supplier, CreateSupplierInput } from '../types';

// NOTE: backend exposes the list at GET /supplier/getAll (not /supplier).
export async function getSuppliers(): Promise<Supplier[]> {
  const { data } = await api.get<Supplier[]>('/supplier/getAll');
  return data;
}

export async function createSupplier(input: CreateSupplierInput): Promise<Supplier> {
  const { data } = await api.post<Supplier>('/supplier', input);
  return data;
}

export async function updateSupplier(id: string, input: CreateSupplierInput): Promise<Supplier> {
  const { data } = await api.put<Supplier>(`/supplier/${id}`, input);
  return data;
}

export async function deleteSupplier(id: string): Promise<void> {
  await api.delete(`/supplier/${id}`);
}

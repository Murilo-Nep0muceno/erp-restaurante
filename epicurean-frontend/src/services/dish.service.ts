import api from './api';
import type { RecipeDish, CreateRecipeDishInput } from '../types';

export async function getDishes(): Promise<RecipeDish[]> {
  const { data } = await api.get<RecipeDish[]>('/recipe-dish');
  return data;
}

// Cardápio público (sem login): só pratos disponíveis, sem ficha técnica.
export async function getPublicMenu(): Promise<RecipeDish[]> {
  const { data } = await api.get<RecipeDish[]>('/recipe-dish/public');
  return data;
}

export async function getDish(id: string): Promise<RecipeDish> {
  const { data } = await api.get<RecipeDish>(`/recipe-dish/${id}`);
  return data;
}

export async function createDish(input: CreateRecipeDishInput): Promise<RecipeDish> {
  const { data } = await api.post<RecipeDish>('/recipe-dish', input);
  return data;
}

export async function updateDish(id: string, input: CreateRecipeDishInput): Promise<RecipeDish> {
  const { data } = await api.put<RecipeDish>(`/recipe-dish/${id}`, input);
  return data;
}

export async function deleteDish(id: string): Promise<void> {
  await api.delete(`/recipe-dish/${id}`);
}

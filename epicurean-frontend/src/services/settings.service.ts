import api from './api';
import type { AppSettings, UpdateSettingsInput } from '../types';

export async function getSettings(): Promise<AppSettings> {
  const { data } = await api.get<AppSettings>('/settings');
  return data;
}

// Público (sem login): apenas o nome do restaurante, para o cardápio.
export async function getPublicSettings(): Promise<{ restaurantName: string }> {
  const { data } = await api.get<{ restaurantName: string }>('/settings/public');
  return data;
}

export async function updateSettings(input: UpdateSettingsInput): Promise<AppSettings> {
  const { data } = await api.put<AppSettings>('/settings', input);
  return data;
}

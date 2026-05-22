import api from './api';

export async function exportBackup(): Promise<unknown> {
  const { data } = await api.get('/backup');
  return data;
}

export async function restoreBackup(data: unknown): Promise<void> {
  await api.post('/backup/restore', data);
}

export async function resetData(): Promise<void> {
  await api.post('/backup/reset');
}

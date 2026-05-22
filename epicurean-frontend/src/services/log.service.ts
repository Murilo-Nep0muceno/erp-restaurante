import api from './api';
import type { LogEntry } from '../types';

export async function getLogs(): Promise<LogEntry[]> {
  const { data } = await api.get<LogEntry[]>('/logs');
  return data;
}

// Fire-and-forget audit recording. The user is derived from the JWT on the
// backend, so we only send the action. Failures are swallowed on purpose —
// logging must never block the action that triggered it.
export function recordLog(action: string): void {
  void api.post('/logs', { action }).catch(() => undefined);
}

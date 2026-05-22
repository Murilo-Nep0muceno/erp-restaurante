import { createContext, useContext } from 'react';

export interface NotifContextValue {
  notify: (message: string, icon?: string) => void;
}

export const NotifContext = createContext<NotifContextValue | null>(null);

export function useNotif(): NotifContextValue {
  const ctx = useContext(NotifContext);
  if (!ctx) throw new Error('useNotif deve ser usado dentro de <NotifProvider>');
  return ctx;
}

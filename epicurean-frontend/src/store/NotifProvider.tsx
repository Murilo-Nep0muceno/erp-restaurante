import { useCallback, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { NotifContext } from './notifContext';

export function NotifProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ message: string; icon: string; show: boolean }>({
    message: '',
    icon: '✓',
    show: false,
  });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = useCallback((message: string, icon = '✓') => {
    setState({ message, icon, show: true });
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setState((s) => ({ ...s, show: false }));
    }, 3000);
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <NotifContext.Provider value={value}>
      {children}
      <div className={`notif${state.show ? ' show' : ''}`} role="status" aria-live="polite">
        <span>{state.icon}</span>
        <span>{state.message}</span>
      </div>
    </NotifContext.Provider>
  );
}

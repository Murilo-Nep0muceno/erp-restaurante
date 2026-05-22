import { useCallback, useEffect, useState } from 'react';

const KEY = 'epicurean_high_contrast';

export function useHighContrast(): [boolean, () => void] {
  const [enabled, setEnabled] = useState(() => localStorage.getItem(KEY) === '1');

  useEffect(() => {
    document.body.classList.toggle('high-contrast', enabled);
    localStorage.setItem(KEY, enabled ? '1' : '0');
  }, [enabled]);

  const toggle = useCallback(() => setEnabled((v) => !v), []);
  return [enabled, toggle];
}

const KEY = 'epicurean_dish_categories';
const DEFAULTS = ['Entradas', 'Pratos Principais', 'Sobremesas', 'Bebidas'];

export function getCustomCategories(): string[] {
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export function addCategory(name: string): void {
  const trimmed = name.trim();
  if (!trimmed) return;
  const current = getCustomCategories();
  if (!current.includes(trimmed) && !DEFAULTS.includes(trimmed)) {
    localStorage.setItem(KEY, JSON.stringify([...current, trimmed]));
  }
}

// Default categories + custom ones + any already used by dishes (deduped, order preserved).
export function allCategories(dishCategories: (string | null | undefined)[]): string[] {
  const set = new Set<string>(DEFAULTS);
  for (const c of getCustomCategories()) set.add(c);
  for (const c of dishCategories) if (c) set.add(c);
  return [...set];
}

export { DEFAULTS as DEFAULT_CATEGORIES };

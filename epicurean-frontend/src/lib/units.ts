// Famílias de medida e conversão entre unidades compatíveis.
// massa: kg/g · volume: l/ml · contagem: un
type Family = 'mass' | 'vol' | 'count';

const FAMILY: Record<string, Family> = {
  kg: 'mass',
  g: 'mass',
  l: 'vol',
  ml: 'vol',
  un: 'count',
};

// Fator para a base comum da família (massa→g, volume→ml, contagem→un).
const FACTOR: Record<string, number> = {
  kg: 1000,
  g: 1,
  l: 1000,
  ml: 1,
  un: 1,
};

// Unidades que podem ser usadas na receita para um item guardado em `base`.
export function compatibleUnits(base: string): string[] {
  const fam = FAMILY[base];
  if (fam === 'mass') return ['kg', 'g'];
  if (fam === 'vol') return ['l', 'ml'];
  return [base || 'un'];
}

// Converte uma quantidade de `from` para `to` (mesma família). Se incompatível, retorna como está.
export function convertQty(qty: number, from: string, to: string): number {
  if (from === to) return qty;
  if (FAMILY[from] && FAMILY[from] === FAMILY[to]) {
    return (qty * FACTOR[from]) / FACTOR[to];
  }
  return qty;
}

export const ALL_UNITS = ['kg', 'g', 'l', 'ml', 'un'];

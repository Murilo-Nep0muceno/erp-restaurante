export type Unit = 'kg' | 'g' | 'l' | 'ml';

export class UnitConverter {
  private static readonly baseUnit: Record<Unit, number> = {
    g: 1,
    kg: 1000,
    ml: 1,
    l: 1000,
  };

  static convert(value: number, from: Unit, to: Unit): number {
    if ((from === 'g' || from === 'kg') && (to === 'l' || to === 'ml')) {
      throw new Error(`Conversão não suportada: ${from} -> ${to}`);
    }

    return (value * this.baseUnit[from]) / this.baseUnit[to];
  }

  // Converte só dentro da mesma família conversível (massa/volume). Para
  // unidades sem conversão (un, cx, pct) ou famílias diferentes, retorna o
  // valor como está em vez de lançar erro.
  static safeConvert(value: number, from: string, to: string): number {
    if (from === to) return value;
    const convertible = (u: string): u is Unit =>
      u === 'g' || u === 'kg' || u === 'l' || u === 'ml';
    if (!convertible(from) || !convertible(to)) return value;
    const sameFamily =
      (from === 'g' || from === 'kg') === (to === 'g' || to === 'kg');
    if (!sameFamily) return value;
    return this.convert(value, from, to);
  }
}

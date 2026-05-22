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
}

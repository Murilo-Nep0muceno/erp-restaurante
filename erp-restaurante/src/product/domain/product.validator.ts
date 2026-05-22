export class ProductValidator {
  static readonly validUnits = ['kg', 'g', 'un', 'l', 'ml'];

  static validateUnit(unit: string) {
    if (!this.validUnits.includes(unit))
      throw new Error('Unidade de medida inválida');
  }
}

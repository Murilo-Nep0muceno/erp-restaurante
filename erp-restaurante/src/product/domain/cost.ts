// Custo médio ponderado (CMP). Recalcula o custo unitário de um item ao receber
// uma nova entrada, ponderando pelo saldo em estoque.
export function weightedAverageCost(
  currentQty: number,
  currentCost: number | null,
  incomingQty: number,
  incomingCost: number | null,
): number | null {
  if (incomingCost == null) return currentCost;
  if (currentCost == null || currentQty <= 0) return incomingCost;
  const totalQty = currentQty + incomingQty;
  if (totalQty <= 0) return incomingCost;
  return (currentQty * currentCost + incomingQty * incomingCost) / totalQty;
}

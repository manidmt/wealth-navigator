/** Recalcula cantidad y precio medio ponderado al añadir una aportación. */
export function applyContribution(
  pos: { quantity: number; avg_cost: number },
  amount: number,
  units: number,
): { quantity: number; avg_cost: number } {
  const newQty = pos.quantity + units;
  if (newQty <= 0) return { quantity: pos.quantity, avg_cost: pos.avg_cost };
  const newAvg = (pos.quantity * pos.avg_cost + amount) / newQty;
  return { quantity: newQty, avg_cost: newAvg };
}

export function fireNumber(annualExpense: number, swrRate: number): number {
  return swrRate > 0 ? annualExpense / (swrRate / 100) : 0;
}

export function fireProgress(netWorth: number, fire: number): number {
  if (fire <= 0) return 0;
  return Math.max(0, Math.min(netWorth / fire, 1));
}

export function monthsToFire(
  netWorth: number,
  fire: number,
  monthlySavings: number,
  expectedReturnPct: number,
): number | null {
  if (fire <= 0) return null;
  if (netWorth >= fire) return 0;
  let nw = netWorth;
  const r = expectedReturnPct / 100 / 12;
  for (let m = 1; m <= 1200; m++) {
    nw = nw * (1 + r) + monthlySavings;
    if (nw >= fire) return m;
  }
  return null;
}

export function estimatedFireDate(now: Date, months: number): string {
  const d = new Date(now.getFullYear(), now.getMonth() + months, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export type DedupRow = { id: string; amount: number; type: "income" | "expense"; date: string };
export type DedupQuery = { amount: number; type: "income" | "expense"; date: string };

const DAY = 86400000;

/** Devuelve el id del manual que parece duplicar a `q` (mismo importe+tipo, fecha ±3 días), o null. */
export function findDuplicate(q: DedupQuery, manuals: DedupRow[], toleranceDays = 3): string | null {
  const qt = new Date(q.date).getTime();
  for (const m of manuals) {
    if (m.type !== q.type) continue;
    if (Math.abs(Number(m.amount) - Number(q.amount)) > 0.001) continue;
    const diffDays = Math.abs(new Date(m.date).getTime() - qt) / DAY;
    if (diffDays <= toleranceDays) return m.id;
  }
  return null;
}

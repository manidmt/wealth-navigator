// Motor de reglas de estrategias semipasivas. PURO: sin imports, sin I/O.
// Compartido entre Edge Functions (Deno) y frontend (re-export en src/lib).

export type SignalKey =
  | "vix" | "dxy" | "tips_10y_real" | "hy_spread"
  | "msci_dd" | "gold_dd" | "btc_dd" | "btc_p200w"
  | "btc_mvrv" | "btc_puell" | "insiders_ratio";

export type SignalValue = { value: number; date: string; source: "auto" | "manual" };
export type SignalMap = Partial<Record<SignalKey, SignalValue>>;

export type LadderRule = {
  type: "ladder";
  cadence: "annual" | "monthly";
  signal: SignalKey;
  steps: { lte: number; multi: number }[];
  default: number;
};

export type MatrixRule = {
  type: "matrix";
  cadence: "annual";
  row_signal: SignalKey;
  col_signal: SignalKey;
  row_breaks: number[]; // descendentes: fila = primer i con value >= breaks[i]; si ninguno, última fila
  col_breaks: number[]; // ascendentes: col = nº de breaks estrictamente menores que value
  values: number[][];
  bonus?: { signal: SignalKey; lte: number; add: number };
  max: number;
};

export type ComboRule = {
  type: "combo";
  conditions: { signal: SignalKey; op: "gt" | "gte" | "lt" | "lte"; value: number }[];
  multi: number;
  cooldown_months: number;
};

export type MultiplierRules = {
  base?: LadderRule | MatrixRule;
  trigger?: ComboRule;
};

export const MANUAL_STALE_DAYS = 35;

export function isStale(s: SignalValue, now: Date = new Date()): boolean {
  if (s.source !== "manual") return false;
  const age = (now.getTime() - new Date(s.date).getTime()) / 86400000;
  return age > MANUAL_STALE_DAYS;
}

export type BaseResult = { multi: number; detail: string };

export function evaluateBase(rule: LadderRule | MatrixRule | undefined, signals: SignalMap): BaseResult {
  if (!rule) return { multi: 1, detail: "sin regla" };
  if (rule.type === "ladder") {
    const s = signals[rule.signal];
    if (!s) return { multi: rule.default, detail: `${rule.signal}: sin dato` };
    const hit = rule.steps.filter((st) => s.value <= st.lte);
    const multi = hit.length ? Math.max(...hit.map((st) => st.multi)) : rule.default;
    return { multi, detail: `${rule.signal}=${s.value.toFixed(3)} → x${multi}` };
  }
  return { multi: 1, detail: "matrix: pendiente" }; // se completa en Task 4
}

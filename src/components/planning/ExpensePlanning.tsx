import { useMemo, useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { SectionCard } from "@/components/app/SectionCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBudget, useUpsertBudget, useMonthCategorySpend } from "@/lib/budget-api";
import {
  totalIncome,
  availableForExpenses,
  plannedSavings,
  savingsGap,
  groupActuals,
  type IncomeItem,
  type BudgetMap,
} from "@/lib/budget-calc";
import { euro, formatMonth } from "@/lib/dashboard-data";
import { BudgetTable } from "./BudgetTable";
import { AgentSuggestionPanel } from "./AgentSuggestionPanel";
import { DuplicatePreviousMonthButton } from "./DuplicatePreviousMonthButton";

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const DEFAULT_INCOMES: IncomeItem[] = [
  { label: "Salario", amount: 0 },
  { label: "Otros ingresos", amount: 0 },
  { label: "Extraordinarios", amount: 0 },
];

export function ExpensePlanning() {
  const [month, setMonth] = useState<string>(currentMonth());
  const { data: budget } = useBudget(month);
  const { data: spend = [] } = useMonthCategorySpend(month);
  const upsert = useUpsertBudget();

  const [incomes, setIncomes] = useState<IncomeItem[]>(DEFAULT_INCOMES);
  const [savingsGoal, setSavingsGoal] = useState<number>(0);
  const [budgets, setBudgets] = useState<BudgetMap>({});

  // Se siembra el estado local una sola vez por mes. No volvemos a hacerlo en cada
  // refetch (cada guardado invalida la query): si lo hiciéramos, una respuesta lenta
  // podría revertir lo que el usuario acaba de teclear.
  const seededMonthRef = useRef<string | null>(null);
  useEffect(() => {
    seededMonthRef.current = null;
  }, [month]);
  useEffect(() => {
    if (budget === undefined) return; // cargando
    if (seededMonthRef.current === month) return; // ya sembrado este mes
    if (budget && budget.month !== month) return; // datos obsoletos del mes anterior
    seededMonthRef.current = month;
    if (budget) {
      setIncomes(budget.incomes?.length ? budget.incomes : DEFAULT_INCOMES);
      setSavingsGoal(Number(budget.savings_goal) || 0);
      setBudgets(budget.budgets ?? {});
    } else {
      setIncomes(DEFAULT_INCOMES);
      setSavingsGoal(0);
      setBudgets({});
    }
  }, [budget, month]);

  const actuals = useMemo(() => groupActuals(spend), [spend]);

  const income = totalIncome(incomes);
  const available = availableForExpenses(incomes, savingsGoal);
  const planSavings = plannedSavings(incomes, budgets);
  const gap = savingsGap(incomes, budgets, savingsGoal);

  function save(next: { incomes?: IncomeItem[]; savings_goal?: number; budgets?: BudgetMap }) {
    upsert.mutate({
      month,
      incomes: next.incomes ?? incomes,
      savings_goal: next.savings_goal ?? savingsGoal,
      budgets: next.budgets ?? budgets,
    });
  }

  function updateIncome(idx: number, patch: Partial<IncomeItem>) {
    const next = incomes.map((it, i) => (i === idx ? { ...it, ...patch } : it));
    setIncomes(next);
    save({ incomes: next });
  }
  function addIncome() {
    const next = [...incomes, { label: "Ingreso", amount: 0 }];
    setIncomes(next);
    save({ incomes: next });
  }
  function removeIncome(idx: number) {
    const next = incomes.filter((_, i) => i !== idx);
    setIncomes(next);
    save({ incomes: next });
  }
  function updateBudget(groupKey: string, amount: number) {
    const next = { ...budgets, [groupKey]: amount };
    setBudgets(next);
    save({ budgets: next });
  }
  function updateGoal(value: number) {
    setSavingsGoal(value);
    save({ savings_goal: value });
  }

  return (
    <div className="space-y-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMonth(shiftMonth(month, -1))}
            className="rounded-md border border-border p-1.5 text-muted-foreground hover:text-foreground"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[140px] text-center text-[14px] font-semibold capitalize">
            {formatMonth(month)}
          </span>
          <button
            type="button"
            onClick={() => setMonth(shiftMonth(month, 1))}
            className="rounded-md border border-border p-1.5 text-muted-foreground hover:text-foreground"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <DuplicatePreviousMonthButton month={month} hasData={!!budget} />
      </div>

      <SectionCard title="Ingresos previstos" description="Lo que esperas ingresar este mes.">
        <div className="space-y-2">
          {incomes.map((it, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Input
                value={it.label}
                onChange={(e) => updateIncome(idx, { label: e.target.value })}
                className="text-[13px]"
              />
              <Input
                type="number"
                step="1"
                value={it.amount}
                onChange={(e) => updateIncome(idx, { amount: Number(e.target.value) || 0 })}
                className="w-32 text-right text-[13px]"
              />
              <button
                type="button"
                onClick={() => removeIncome(idx)}
                className="rounded-md p-1.5 text-muted-foreground hover:text-red-500"
                aria-label="Quitar ingreso"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addIncome}
            className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
            Añadir ingreso
          </button>
          <div className="flex justify-between border-t border-border pt-2 text-[13px] font-semibold">
            <span>Total ingresos</span>
            <span>{euro.format(income)}</span>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Objetivo de ahorro" description="Cuánto quieres ahorrar este mes.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-[12px]">Objetivo (€)</Label>
            <Input
              type="number"
              step="1"
              value={savingsGoal}
              onChange={(e) => updateGoal(Number(e.target.value) || 0)}
              className="text-[13px]"
            />
          </div>
          <div className="space-y-1 rounded-md bg-muted/40 px-3 py-2 text-[12px]">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Disponible para gastos</span>
              <span className="font-medium">{euro.format(available)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ahorro planificado</span>
              <span className="font-medium">{euro.format(planSavings)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Objetivo</span>
              <span className="font-medium">{euro.format(savingsGoal)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-1">
              <span className="text-muted-foreground">{gap < 0 ? "Déficit" : "Holgura"}</span>
              <span
                className={`font-semibold ${gap < 0 ? "text-red-500" : "text-emerald-600 dark:text-emerald-400"}`}
              >
                {gap < 0 ? "" : "+"}
                {euro.format(gap)}
              </span>
            </div>
          </div>
        </div>
      </SectionCard>

      <BudgetTable budgets={budgets} actuals={actuals} onChange={updateBudget} />

      <AgentSuggestionPanel
        month={month}
        incomes={incomes}
        savingsGoal={savingsGoal}
        budgets={budgets}
        actuals={actuals}
      />
    </div>
  );
}

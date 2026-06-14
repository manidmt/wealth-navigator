import { SectionCard } from "@/components/app/SectionCard";
import { Input } from "@/components/ui/input";
import { BUDGET_GROUPS } from "@/lib/budget-groups";
import { budgetStatus, totalBudgeted, type BudgetMap } from "@/lib/budget-calc";
import { euro } from "@/lib/dashboard-data";

export function BudgetTable({
  budgets,
  actuals,
  onChange,
}: {
  budgets: BudgetMap;
  actuals: BudgetMap;
  onChange: (groupKey: string, amount: number) => void;
}) {
  const totalPlanned = totalBudgeted(budgets);
  const totalActual = totalBudgeted(actuals);

  return (
    <SectionCard
      title="Presupuesto por categoría"
      description="Cuánto quieres gastar en cada grupo y cómo vas frente a lo real."
    >
      <div className="overflow-x-auto">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="pb-2 pr-4 font-medium">Grupo</th>
              <th className="pb-2 pr-4 text-right font-medium">Presupuesto</th>
              <th className="pb-2 pr-4 text-right font-medium">Gastado</th>
              <th className="pb-2 pr-4 font-medium">Consumido</th>
              <th className="pb-2 pr-4 text-right font-medium">Restante</th>
              <th className="pb-2 text-right font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {BUDGET_GROUPS.map((g) => {
              const planned = budgets[g.key] ?? 0;
              const actual = actuals[g.key] ?? 0;
              const { pct, remaining, over } = budgetStatus(planned, actual);
              const barPct = Math.min(pct, 1) * 100;
              return (
                <tr key={g.key}>
                  <td className="py-2 pr-4 font-medium text-foreground">{g.label}</td>
                  <td className="py-2 pr-4 text-right">
                    <Input
                      type="number"
                      step="1"
                      value={planned}
                      onChange={(e) => onChange(g.key, Number(e.target.value) || 0)}
                      className="ml-auto w-24 text-right text-[12.5px]"
                    />
                  </td>
                  <td className="py-2 pr-4 text-right">{euro.format(actual)}</td>
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full ${over ? "bg-red-500" : "bg-primary"}`}
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {planned > 0 ? `${Math.round(pct * 100)}%` : "—"}
                      </span>
                    </div>
                  </td>
                  <td className={`py-2 pr-4 text-right ${remaining < 0 ? "text-red-500" : ""}`}>
                    {euro.format(remaining)}
                  </td>
                  <td className="py-2 text-right">
                    {planned === 0 ? (
                      <span className="text-muted-foreground">Sin presupuesto</span>
                    ) : over ? (
                      <span className="text-red-500">Te pasas</span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400">Vas bien</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-border font-semibold">
              <td className="py-2 pr-4">Total</td>
              <td className="py-2 pr-4 text-right">{euro.format(totalPlanned)}</td>
              <td className="py-2 pr-4 text-right">{euro.format(totalActual)}</td>
              <td className="py-2 pr-4" />
              <td className="py-2 pr-4 text-right">{euro.format(totalPlanned - totalActual)}</td>
              <td className="py-2" />
            </tr>
          </tfoot>
        </table>
      </div>
    </SectionCard>
  );
}

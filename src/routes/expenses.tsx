import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader, SectionCard, SectionLabel } from "@/components/app/SectionCard";
import { KpiCard } from "@/components/app/KpiCard";
import { DeltaBadge } from "@/components/app/DeltaBadge";
import { BarList, MonthlyExpensesBars } from "@/components/charts/charts";
import { data, euro1, formatMonth } from "@/lib/dashboard-data";

export const Route = createFileRoute("/expenses")({
  head: () => ({
    meta: [
      { title: "Gastos mensuales — Wealth Studio" },
      {
        name: "description",
        content: "Resumen mensual de ingresos y gastos por categoría con histórico.",
      },
    ],
  }),
  component: ExpensesPage,
});

function ExpensesPage() {
  const months = data.expenses.byMonth;
  const current = months[months.length - 1];
  const prev = months[months.length - 2];
  const expenseDelta =
    prev && prev.expenseTotal > 0
      ? (current.expenseTotal - prev.expenseTotal) / prev.expenseTotal
      : 0;
  const netDelta = current.net - (prev?.net ?? 0);

  const top = data.expenses.currentMonthCategories.slice(0, 6);
  const totalCats = top.reduce((a, b) => a + b.value, 0);

  return (
    <AppShell pageEyebrow="Movimientos">
      <PageHeader
        eyebrow={formatMonth(data.expenses.currentMonth)}
        title="Gastos mensuales"
        description="Ingresos y gastos del periodo actual con vista histórica de los últimos 12 meses."
      />

      <div className="space-y-10 px-4 py-8 md:px-8">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Gasto del mes"
            value={euro1.format(data.expenses.currentMonthTotal)}
            hint={`Frente a ${euro1.format(prev?.expenseTotal ?? 0)} mes anterior`}
            badge={<DeltaBadge value={expenseDelta} asPercent invert />}
          />
          <KpiCard
            label="Ingresos del mes"
            value={euro1.format(data.expenses.currentMonthIncome)}
            hint="Salarios, dividendos y otros ingresos"
          />
          <KpiCard
            label="Neto del mes"
            value={euro1.format(current.net)}
            badge={<DeltaBadge value={netDelta} />}
            hint="Ingresos menos gastos"
          />
          <KpiCard
            accent="primary"
            label="Tasa de ahorro"
            value={
              data.expenses.currentMonthIncome > 0
                ? `${((current.net / data.expenses.currentMonthIncome) * 100).toFixed(0)}%`
                : "—"
            }
            hint="Sobre ingresos totales del mes"
          />
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.7fr_1fr]">
          <SectionCard
            title="Histórico mensual"
            description="Ingresos, gastos y neto de los últimos 12 cierres."
          >
            <MonthlyExpensesBars rows={months} />
          </SectionCard>

          <SectionCard
            title="Top categorías del mes"
            description={`Distribución de ${euro1.format(totalCats)}.`}
          >
            <BarList items={top} total={data.expenses.currentMonthTotal} />
          </SectionCard>
        </section>

        <section>
          <SectionLabel>Detalle por mes</SectionLabel>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-[13px]">
              <thead className="bg-muted/40">
                <tr className="text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Mes</th>
                  <th className="px-4 py-3 font-medium text-right">Ingresos</th>
                  <th className="px-4 py-3 font-medium text-right">Gastos</th>
                  <th className="px-4 py-3 font-medium text-right">Neto</th>
                  <th className="px-4 py-3 font-medium text-right">Δ vs anterior</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[...months].reverse().map((m, i, arr) => {
                  const next = arr[i + 1];
                  const delta = next ? m.net - next.net : 0;
                  return (
                    <tr key={m.month} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{formatMonth(m.month)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                        {euro1.format(m.incomeTotal)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                        {euro1.format(m.expenseTotal)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium">
                        {euro1.format(m.net)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {next ? <DeltaBadge value={delta} /> : <span className="text-muted-foreground">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

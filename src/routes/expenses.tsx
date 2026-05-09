import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader, SectionCard, SectionLabel } from "@/components/app/SectionCard";
import { KpiCard } from "@/components/app/KpiCard";
import { DeltaBadge } from "@/components/app/DeltaBadge";
import { BarList, MonthlyExpensesBars, Sparkline } from "@/components/charts/charts";
import { RangeProvider, RangeToolbar, useRange } from "@/components/app/RangeToolbar";
import { MonthDetailDrawer } from "@/components/app/MonthDetailDrawer";
import { ExpenseTagsBreakdown } from "@/components/app/ExpenseTagsBreakdown";
import { useMoney } from "@/components/app/CurrencyProvider";
import { EXPENSE_TAGS, tagSeries } from "@/lib/expense-tags";
import { formatMonth, type ExpenseMonth } from "@/lib/dashboard-data";
import { useDashboard } from "@/hooks/use-dashboard";

export const Route = createFileRoute("/expenses")({
  head: () => ({
    meta: [
      { title: "Gastos mensuales — Wealth Studio" },
      { name: "description", content: "Resumen mensual de ingresos y gastos por categoría con histórico." },
    ],
  }),
  component: ExpensesPage,
});

function ExpensesPage() {
  const data = useDashboard();
  return (
    <AppShell pageEyebrow="Movimientos">
      <PageHeader
        eyebrow={formatMonth(data.expenses.currentMonth)}
        title="Gastos mensuales"
        description="Ingresos y gastos del periodo actual con vista histórica configurable."
      />
      <RangeProvider defaultRange="12M">
        <div className="px-4 md:px-8">
          <RangeToolbar />
        </div>
        <ExpensesBody />
      </RangeProvider>
    </AppShell>
  );
}

function ExpensesBody() {
  const data = useDashboard();
  const { slice, baseline, compare } = useRange();
  const money = useMoney();
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const months = slice(data.expenses.byMonth);
  const current = months[months.length - 1] ?? data.expenses.byMonth[data.expenses.byMonth.length - 1];
  const base = baseline(data.expenses.byMonth) ?? months[0];
  const expenseDelta = base && base.expenseTotal > 0 ? (current.expenseTotal - base.expenseTotal) / base.expenseTotal : 0;
  const netDelta = current.net - (base?.net ?? 0);
  const compareLabel =
    compare === "prev"
      ? `vs ${formatMonth(base.month)}`
      : compare === "first"
        ? `vs inicio ${formatMonth(base.month)}`
        : `vs YTD ${formatMonth(base.month)}`;

  const top = data.expenses.currentMonthCategories.slice(0, 6);
  const totalCats = top.reduce((a, b) => a + b.value, 0);

  const expenseTrend = months.map((m) => m.expenseTotal);
  const incomeTrend = months.map((m) => m.incomeTotal);
  const netTrend = months.map((m) => m.net);

  return (
    <div className="space-y-10 px-4 py-8 md:px-8">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Gasto del mes"
          value={money.format1(data.expenses.currentMonthTotal)}
          hint={`${compareLabel} · ${money.format1(base?.expenseTotal ?? 0)}`}
          badge={<DeltaBadge value={expenseDelta} asPercent invert />}
          series={expenseTrend}
          sparkColor="var(--chart-4)"
        />
        <KpiCard
          label="Ingresos del mes"
          value={money.format1(data.expenses.currentMonthIncome)}
          hint="Salarios, dividendos y otros ingresos"
          series={incomeTrend}
          sparkColor="var(--chart-2)"
        />
        <KpiCard
          label="Neto del mes"
          value={money.format1(current.net)}
          badge={<DeltaBadge value={netDelta} />}
          hint={compareLabel}
          series={netTrend}
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
          description={`Ingresos, gastos y neto · ${months.length} cierres en el rango. Pulsa un mes para ver el detalle.`}
          askPrompt="Analiza el histórico de los últimos 12 meses: tendencia de ingresos, gastos y neto, e identifica meses atípicos."
        >
          <MonthlyExpensesBars rows={months} onSelectMonth={setSelectedMonth} />
        </SectionCard>

        <SectionCard
          title="Top categorías del mes"
          description={`Distribución de ${money.format1(totalCats)}.`}
          askPrompt="¿Qué categorías concentran más mi gasto este mes y dónde podría optimizar?"
        >
          <BarList items={top} total={data.expenses.currentMonthTotal} />
        </SectionCard>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
        <SectionCard
          title="Etiquetas del mes"
          description="Naturaleza del gasto: una transacción puede llevar varias etiquetas."
          askPrompt="Analiza la composición del gasto del mes por etiquetas (Esencial, Recurrente, Ocio…) y sugiere qué etiqueta debería vigilar."
        >
          <ExpenseTagsBreakdown month={current.month} rangeMonths={months} />
        </SectionCard>

        <SectionCard
          title="Etiquetas a lo largo del rango"
          description={`Evolución de cada etiqueta sobre ${months.length} cierres.`}
          askPrompt="¿Qué etiquetas de gasto están creciendo más rápido y cuáles bajan en el rango activo?"
        >
          <TagTrendGrid months={months} />
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
                  <tr
                    key={m.month}
                    onClick={() => setSelectedMonth(m.month)}
                    className="cursor-pointer transition hover:bg-muted/40"
                  >
                    <td className="px-4 py-3 font-medium">{formatMonth(m.month)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{money.format1(m.incomeTotal)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{money.format1(m.expenseTotal)}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">{money.format1(m.net)}</td>
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

      <MonthDetailDrawer
        month={selectedMonth}
        open={!!selectedMonth}
        onOpenChange={(o) => (o ? null : setSelectedMonth(null))}
      />
    </div>
  );
}


function TagTrendGrid({ months }: { months: ExpenseMonth[] }) {
  const money = useMoney();
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {EXPENSE_TAGS.map((t) => {
        const series = tagSeries(months, t.key);
        const last = series[series.length - 1] ?? 0;
        const first = series[0] ?? 0;
        const delta = first > 0 ? (last - first) / first : 0;
        return (
          <li
            key={t.key}
            className="rounded-lg border border-border bg-card p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-[12.5px] font-medium text-foreground">
                <span
                  aria-hidden
                  className="h-2 w-2 rounded-full"
                  style={{ background: t.color }}
                />
                {t.label}
              </span>
              <span
                className={
                  delta > 0
                    ? "text-[11.5px] font-medium tabular-nums text-negative"
                    : delta < 0
                      ? "text-[11.5px] font-medium tabular-nums text-positive"
                      : "text-[11.5px] font-medium tabular-nums text-muted-foreground"
                }
              >
                {delta === 0
                  ? "—"
                  : `${delta > 0 ? "+" : ""}${(delta * 100).toFixed(1)}%`}
              </span>
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground tabular-nums">
              {money.format1(last)} <span className="text-muted-foreground/70">último mes</span>
            </div>
            <div className="mt-2 -mx-1">
              <Sparkline values={series} color={t.color} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}


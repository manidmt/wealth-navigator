import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader, SectionCard, SectionLabel } from "@/components/app/SectionCard";
import { KpiCard } from "@/components/app/KpiCard";
import { DeltaBadge } from "@/components/app/DeltaBadge";
import { RangeProvider, RangeToolbar, useRange } from "@/components/app/RangeToolbar";
import {
  BarList,
  DonutChart,
  NetWorthAreaChart,
} from "@/components/charts/charts";
import { InsightsCard } from "@/components/assistant/InsightsCard";
import {
  data,
  euro,
  euro1,
  formatMonth,
} from "@/lib/dashboard-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Resumen — Wealth Studio" },
      {
        name: "description",
        content:
          "Vista ejecutiva del patrimonio: KPIs, evolución mensual, allocation y gasto del mes.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <AppShell pageEyebrow="Resumen ejecutivo">
      <PageHeader
        eyebrow={`Cierre ${formatMonth(data.latestMonth)}`}
        title="Resumen"
        description={`Vista ejecutiva del patrimonio de ${data.owner}. Cifras consolidadas en EUR sobre el último cierre disponible.`}
        actions={
          <Link
            to="/net-worth"
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-[12.5px] font-medium hover:border-border-strong"
          >
            Ver evolución <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
      />

      <RangeProvider defaultRange="12M">
        <div className="px-4 md:px-8">
          <RangeToolbar label={`Cierre ${formatMonth(data.latestMonth)} · EUR`} />
        </div>
        <HomeBody />
      </RangeProvider>
    </AppShell>
  );
}

function HomeBody() {
  const { slice } = useRange();

  const series = slice(data.series);
  const expenseMonths = slice(data.expenses.byMonth);
  const lastMonths = expenseMonths.slice(-6);

  // KPI computations driven by the active range
  const last = series[series.length - 1] ?? data.series[data.series.length - 1];
  const first = series[0] ?? data.series[0];
  const rangeChange = last.netWorth - first.netWorth;
  const rangeChangePct = first.netWorth > 0 ? rangeChange / first.netWorth : 0;

  const totalSavings = expenseMonths.reduce((acc, m) => acc + m.net, 0);
  const monthlyChange = data.summary.monthlyChange;
  const monthlyChangePct =
    data.summary.netWorth - monthlyChange > 0
      ? monthlyChange / (data.summary.netWorth - monthlyChange)
      : 0;

  const topCats = data.expenses.currentMonthCategories.slice(0, 5);
  const topHoldings = [...data.portfolio.holdings]
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
  const allocationTotal = data.allocation.reduce((a, b) => a + b.value, 0);

  // Sparkline trends from the active range slice
  const netWorthTrend = series.map((p) => p.netWorth);
  const assetsTrend = series.map((p) => p.assets);
  const monthlyDeltas = series
    .map((p, i, arr) => (i === 0 ? 0 : p.netWorth - arr[i - 1].netWorth))
    .slice(1);
  const savingsTrend = expenseMonths.map((m) => m.net);

  return (
    <div className="space-y-10 px-4 py-8 md:px-8">
      <section>
        <SectionLabel>Patrimonio en el rango</SectionLabel>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            accent="primary"
            label="Patrimonio neto"
            value={euro.format(last.netWorth)}
            hint={`Activos ${euro.format(last.assets)} · Pasivos ${euro.format(last.liabilities)}`}
            badge={<DeltaBadge value={monthlyChangePct} asPercent />}
            series={netWorthTrend}
          />
          <KpiCard
            label="Variación en el rango"
            value={euro1.format(rangeChange)}
            hint={`${formatMonth(first.month)} → ${formatMonth(last.month)}`}
            badge={<DeltaBadge value={rangeChangePct} asPercent />}
            series={monthlyDeltas}
            sparkColor={rangeChange >= 0 ? "var(--positive)" : "var(--negative)"}
          />
          <KpiCard
            label="Ahorro acumulado"
            value={euro1.format(totalSavings)}
            hint={`${expenseMonths.length} cierres en el rango`}
            series={savingsTrend}
            sparkColor="var(--chart-2)"
          />
          <KpiCard
            label="Activos totales"
            value={euro.format(last.assets)}
            hint={`${data.holdings.length} posiciones agregadas`}
            series={assetsTrend}
          />
        </div>
      </section>

      <InsightsCard />

      <section className="grid gap-5 lg:grid-cols-[1.55fr_1fr]">
        <SectionCard
          title="Evolución del patrimonio"
          description={`Serie mensual desde ${formatMonth(first.month)}.`}
          askPrompt="Analiza la evolución del patrimonio neto: tendencia, mejores y peores meses, y ritmo de crecimiento."
          actions={
            <Link
              to="/net-worth"
              className="text-[12px] font-medium text-muted-foreground hover:text-foreground"
            >
              Detalle →
            </Link>
          }
        >
          <NetWorthAreaChart series={series} />
        </SectionCard>

        <SectionCard
          title="Distribución del patrimonio"
          description="Composición por tipo de activo sobre el total."
          askPrompt="¿Está bien diversificada mi distribución por tipo de activo? Señala concentraciones."
        >
          <DonutChart data={data.allocation} total={allocationTotal} />
        </SectionCard>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <SectionCard
          title={`Gasto del mes — ${formatMonth(data.expenses.currentMonth)}`}
          description={`Total ${euro1.format(data.expenses.currentMonthTotal)} · Ingresos ${euro1.format(data.expenses.currentMonthIncome)}`}
          askPrompt={`Explícame el gasto de ${formatMonth(data.expenses.currentMonth)}: top categorías, anomalías y comparativa con el mes anterior.`}
          actions={
            <Link
              to="/expenses"
              className="text-[12px] font-medium text-muted-foreground hover:text-foreground"
            >
              Detalle →
            </Link>
          }
        >
          <BarList items={topCats} />
        </SectionCard>

        <SectionCard
          title="Posiciones principales"
          description="Top posiciones por valor de mercado."
          askPrompt="Comenta mis posiciones principales: peso relativo, riesgo de concentración y posibles ajustes."
          actions={
            <Link
              to="/portfolio"
              className="text-[12px] font-medium text-muted-foreground hover:text-foreground"
            >
              Portfolio →
            </Link>
          }
        >
          <ul className="divide-y divide-border">
            {topHoldings.map((h) => (
              <li
                key={h.label + h.platform}
                className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-medium text-foreground">
                    {h.label}
                  </div>
                  <div className="text-[11.5px] text-muted-foreground">
                    {h.platform}
                  </div>
                </div>
                <div className="text-[13px] font-medium tabular-nums">
                  {euro1.format(h.value)}
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      </section>

      <section>
        <SectionLabel>Últimos cierres en el rango</SectionLabel>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {lastMonths.map((m) => (
            <div
              key={m.month}
              className="rounded-lg border border-border bg-card p-3.5"
            >
              <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                {formatMonth(m.month)}
              </div>
              <div className="mt-1 font-display text-base font-semibold tabular-nums">
                {euro1.format(m.net)}
              </div>
              <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                Gasto {euro1.format(m.expenseTotal)}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

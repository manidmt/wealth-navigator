import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader, SectionCard, SectionLabel } from "@/components/app/SectionCard";
import { KpiCard } from "@/components/app/KpiCard";
import { DeltaBadge } from "@/components/app/DeltaBadge";
import { NetWorthAreaChart } from "@/components/charts/charts";
import { data, euro, euro1, formatMonth } from "@/lib/dashboard-data";

export const Route = createFileRoute("/net-worth")({
  head: () => ({
    meta: [
      { title: "Patrimonio — Wealth Studio" },
      {
        name: "description",
        content: "Evolución mensual del patrimonio neto, activos y pasivos.",
      },
    ],
  }),
  component: NetWorthPage,
});

function NetWorthPage() {
  const series = data.series;
  const last = series[series.length - 1];
  const first = series[0];
  const totalGrowth = last.netWorth - first.netWorth;
  const totalGrowthPct = first.netWorth > 0 ? totalGrowth / first.netWorth : 0;

  return (
    <AppShell pageEyebrow="Patrimonio">
      <PageHeader
        eyebrow="Histórico"
        title="Patrimonio"
        description={`Evolución mensual del patrimonio neto desde ${formatMonth(first.month)} hasta ${formatMonth(last.month)}.`}
      />

      <div className="space-y-10 px-4 py-8 md:px-8">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            accent="primary"
            label="Patrimonio neto"
            value={euro.format(last.netWorth)}
            hint={`Cierre ${formatMonth(last.month)}`}
          />
          <KpiCard
            label="Activos"
            value={euro.format(last.assets)}
            hint="Total bruto del cierre"
          />
          <KpiCard
            label="Pasivos"
            value={euro.format(last.liabilities)}
            hint="Préstamos y deudas"
          />
          <KpiCard
            label="Crecimiento total"
            value={euro1.format(totalGrowth)}
            badge={<DeltaBadge value={totalGrowthPct} asPercent />}
            hint={`Desde ${formatMonth(first.month)}`}
          />
        </section>

        <SectionCard
          title="Evolución del patrimonio neto"
          description="Patrimonio consolidado mes a mes."
          askPrompt="Describe la evolución de mi patrimonio neto: meses de mayor crecimiento, retrocesos y ritmo medio."
        >
          <NetWorthAreaChart series={series} />
        </SectionCard>

        <section>
          <SectionLabel>Snapshots mensuales</SectionLabel>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-[13px]">
              <thead className="bg-muted/40">
                <tr className="text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Mes</th>
                  <th className="px-4 py-3 font-medium text-right">Activos</th>
                  <th className="px-4 py-3 font-medium text-right">Pasivos</th>
                  <th className="px-4 py-3 font-medium text-right">Patrimonio</th>
                  <th className="px-4 py-3 font-medium text-right">Ahorro</th>
                  <th className="px-4 py-3 font-medium text-right">Δ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[...series].reverse().map((p, i, arr) => {
                  const next = arr[i + 1];
                  const delta = next ? p.netWorth - next.netWorth : 0;
                  return (
                    <tr key={p.month} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{formatMonth(p.month)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                        {euro1.format(p.assets)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                        {euro1.format(p.liabilities)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium">
                        {euro1.format(p.netWorth)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                        {euro1.format(p.savings)}
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

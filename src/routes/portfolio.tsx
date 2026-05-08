import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader, SectionCard } from "@/components/app/SectionCard";
import { KpiCard } from "@/components/app/KpiCard";
import { BarList, DonutChart } from "@/components/charts/charts";
import { data, euro, euro1 } from "@/lib/dashboard-data";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfolio — Wealth Studio" },
      {
        name: "description",
        content: "Posiciones invertidas, exposición por plataforma y por categoría.",
      },
    ],
  }),
  component: PortfolioPage,
});

function PortfolioPage() {
  const holdings = [...data.portfolio.holdings].sort((a, b) => b.value - a.value);
  const total = holdings.reduce((a, b) => a + b.value, 0);
  const byPlatform = data.portfolio.byPlatform ?? [];

  // Grouping by category from holdings (string fallback)
  const byCategoryMap = new Map<string, number>();
  for (const h of holdings) {
    const k = h.category ?? "Otros";
    byCategoryMap.set(k, (byCategoryMap.get(k) ?? 0) + h.value);
  }
  const byCategory = [...byCategoryMap.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <AppShell pageEyebrow="Cartera invertida">
      <PageHeader
        eyebrow="Live"
        title="Portfolio"
        description="Exposición consolidada por activo, plataforma y categoría. Valoración en EUR sobre el último precio disponible."
      />

      <div className="space-y-10 px-4 py-8 md:px-8">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            accent="primary"
            label="Valor de mercado"
            value={euro.format(total)}
            hint={`${holdings.length} posiciones activas`}
          />
          <KpiCard
            label="Plataformas"
            value={String(byPlatform.length || new Set(holdings.map((h) => h.platform)).size)}
            hint="Brokers y wallets agregados"
          />
          <KpiCard
            label="Categorías"
            value={String(byCategory.length)}
            hint="Tipos de activo"
          />
          <KpiCard
            label="Mayor posición"
            value={holdings[0] ? euro1.format(holdings[0].value) : "—"}
            hint={holdings[0]?.label ?? ""}
          />
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <SectionCard title="Por categoría" description="Peso de cada tipo de activo.">
            <DonutChart data={byCategory} total={total} />
          </SectionCard>
          <SectionCard title="Por plataforma" description="Distribución entre brokers y custodios.">
            <BarList items={byPlatform.length ? byPlatform : []} total={total} />
          </SectionCard>
        </section>

        <SectionCard title="Posiciones" description="Detalle ordenado por valor de mercado.">
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-[13px]">
              <thead className="bg-muted/40">
                <tr className="text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Activo</th>
                  <th className="px-4 py-3 font-medium">Categoría</th>
                  <th className="px-4 py-3 font-medium">Plataforma</th>
                  <th className="px-4 py-3 font-medium text-right">Valor</th>
                  <th className="px-4 py-3 font-medium text-right">Peso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {holdings.map((h) => {
                  const w = total > 0 ? (h.value / total) * 100 : 0;
                  return (
                    <tr key={h.label + h.platform} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{h.label}</td>
                      <td className="px-4 py-3 text-muted-foreground">{h.category ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{h.platform}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium">
                        {euro1.format(h.value)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                        {w.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}

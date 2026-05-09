import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader, SectionCard } from "@/components/app/SectionCard";
import { KpiCard } from "@/components/app/KpiCard";
import { PlatformBadge } from "@/components/app/PlatformBadge";
import { HoldingDrawer } from "@/components/app/HoldingDrawer";
import { BarList, DonutChart } from "@/components/charts/charts";
import { useMoney } from "@/components/app/CurrencyProvider";
import { data, type Holding } from "@/lib/dashboard-data";
import { freshnessLabel } from "@/lib/holding-details";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfolio — Wealth Studio" },
      { name: "description", content: "Posiciones invertidas, exposición por plataforma y por categoría." },
    ],
  }),
  component: PortfolioPage,
});

function PortfolioPage() {
  const money = useMoney();
  const allHoldings = [...data.portfolio.holdings].sort((a, b) => b.value - a.value);
  const total = allHoldings.reduce((a, b) => a + b.value, 0);
  const byPlatform = data.portfolio.byPlatform ?? [];

  const byCategoryMap = new Map<string, number>();
  for (const h of allHoldings) {
    const k = h.category ?? "Otros";
    byCategoryMap.set(k, (byCategoryMap.get(k) ?? 0) + h.value);
  }
  const byCategory = [...byCategoryMap.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  const categories = useMemo(
    () => Array.from(new Set(allHoldings.map((h) => h.category ?? "Otros"))).sort(),
    [allHoldings],
  );
  const platforms = useMemo(
    () => Array.from(new Set(allHoldings.map((h) => h.platform))).sort(),
    [allHoldings],
  );

  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const filtered = allHoldings.filter(
    (h) =>
      (categoryFilter === "all" || (h.category ?? "Otros") === categoryFilter) &&
      (platformFilter === "all" || h.platform === platformFilter),
  );
  const filteredTotal = filtered.reduce((a, b) => a + b.value, 0);
  const hasFilter = categoryFilter !== "all" || platformFilter !== "all";

  const [selected, setSelected] = useState<Holding | null>(null);
  const freshness = freshnessLabel(data.generatedAt);

  return (
    <AppShell pageEyebrow="Cartera invertida">
      <PageHeader
        eyebrow="Live"
        title="Portfolio"
        description="Exposición consolidada por activo, plataforma y categoría. Valoración en EUR sobre el último precio disponible."
      />

      <div className="space-y-10 px-4 py-8 md:px-8">
        <section>
          <KpiCard
            accent="primary"
            label="Valor de mercado"
            value={money.format(total)}
            hint={
              <span className="inline-flex items-center gap-2">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inset-0 animate-ping rounded-full bg-primary-foreground/40" />
                  <span className="relative h-1.5 w-1.5 rounded-full bg-primary-foreground/80" />
                </span>
                {freshness} · {allHoldings.length} posiciones · {platforms.length} plataformas
              </span>
            }
          />
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <SectionCard title="Por categoría" description="Peso de cada tipo de activo." askPrompt="¿Cómo está repartido mi portfolio por tipo de activo y dónde hay sobreexposición?">
            <DonutChart data={byCategory} total={total} />
          </SectionCard>
          <SectionCard title="Por plataforma" description="Distribución entre brokers y custodios." askPrompt="¿En qué plataformas tengo más concentración y cuál es el riesgo asociado?">
            <BarList items={byPlatform.length ? byPlatform : []} total={total} />
          </SectionCard>
        </section>

        <SectionCard
          title="Posiciones"
          description="Pulsa una fila para ver el detalle."
          askPrompt="Revisa mis posiciones: cuáles destacan, cuáles deberían reducirse y propuestas de rebalance."
        >
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                Categoría
              </span>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-8 w-[170px] text-[12.5px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                Plataforma
              </span>
              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger className="h-8 w-[180px] text-[12.5px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {platforms.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {hasFilter && (
              <button
                type="button"
                onClick={() => {
                  setCategoryFilter("all");
                  setPlatformFilter("all");
                }}
                className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11.5px] text-muted-foreground transition hover:text-foreground"
              >
                <X className="h-3 w-3" /> Limpiar
              </button>
            )}
            <div className="ml-auto text-[12px] tabular-nums text-muted-foreground">
              {filtered.length} de {allHoldings.length} ·{" "}
              <span className="text-foreground">{money.format(filteredTotal)}</span>
            </div>
          </div>

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
                {filtered.map((h) => {
                  const w = total > 0 ? (h.value / total) * 100 : 0;
                  return (
                    <tr
                      key={h.label + h.platform}
                      onClick={() => setSelected(h)}
                      className="cursor-pointer transition hover:bg-muted/40"
                    >
                      <td className="px-4 py-3 font-medium">{h.label}</td>
                      <td className="px-4 py-3 text-muted-foreground">{h.category ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <PlatformBadge name={h.platform} />
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium">{money.format1(h.value)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{w.toFixed(1)}%</td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-[12.5px] text-muted-foreground">
                      No hay posiciones con esos filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>

      <HoldingDrawer
        holding={selected}
        total={total}
        open={!!selected}
        onOpenChange={(o) => (o ? null : setSelected(null))}
      />
    </AppShell>
  );
}

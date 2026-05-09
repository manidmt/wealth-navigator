import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader, SectionCard, SectionLabel } from "@/components/app/SectionCard";
import { KpiCard } from "@/components/app/KpiCard";
import { Badge } from "@/components/ui/badge";
import { PlatformBadge } from "@/components/app/PlatformBadge";
import { HoldingDrawer } from "@/components/app/HoldingDrawer";
import { useMoney } from "@/components/app/CurrencyProvider";
import { formatMonth, type Holding } from "@/lib/dashboard-data";
import { useDashboard } from "@/hooks/use-dashboard";

export const Route = createFileRoute("/balances")({
  head: () => ({
    meta: [
      { title: "Saldos y cierres — Wealth Studio" },
      {
        name: "description",
        content: "Saldos por cuenta y cierres mensuales consolidados.",
      },
    ],
  }),
  component: BalancesPage,
});

const bucketFor = (label: string, category?: string, value = 0) => {
  if (value < 0) return { key: "liabilities", label: "Pasivos" };
  const t = `${label} ${category ?? ""}`.toLowerCase();
  if (/(cuenta|cash|deposit|saving|main bank|broker cash)/.test(t))
    return { key: "cash", label: "Cash" };
  if (/(fondo|etf|acci|stock|fund|crypto|bitcoin|gold|oro)/.test(t))
    return { key: "investable", label: "Invertible" };
  return { key: "other", label: "Otros activos" };
};

function BalancesPage() {
  const data = useDashboard();
  const money = useMoney();
  const accounts = data.holdings.map((h, i) => {
    const b = bucketFor(h.label, h.category, h.value);
    return { id: i, ...h, bucket: b };
  });
  const totalAbs = accounts.reduce((acc, a) => acc + Math.abs(a.value), 0);
  const [selected, setSelected] = useState<Holding | null>(null);

  const groups = ["cash", "investable", "other", "liabilities"] as const;
  const grouped = groups.map((g) => ({
    key: g,
    label:
      g === "cash"
        ? "Cash"
        : g === "investable"
          ? "Activos invertibles"
          : g === "other"
            ? "Otros activos"
            : "Pasivos",
    rows: accounts.filter((a) => a.bucket.key === g),
    total: accounts
      .filter((a) => a.bucket.key === g)
      .reduce((acc, a) => acc + a.value, 0),
  }));

  const totalAssets = grouped
    .filter((g) => g.key !== "liabilities")
    .reduce((acc, g) => acc + g.total, 0);
  const totalLiab = Math.abs(grouped.find((g) => g.key === "liabilities")?.total ?? 0);

  // Trends from the closure history for the KPI sparklines
  const trail = data.series.slice(-12);
  const assetsTrend = trail.map((p) => p.assets);
  const liabTrend = trail.map((p) => Math.abs(p.liabilities));
  const netTrend = trail.map((p) => p.netWorth);
  const closureCount = data.series.length;

  return (
    <AppShell pageEyebrow="Cuentas y snapshots">
      <PageHeader
        eyebrow={`Cierre ${formatMonth(data.latestMonth)}`}
        title="Saldos y cierres"
        description="Saldos vivos por cuenta agrupados por bloque, y cierres mensuales registrados."
      />

      <div className="space-y-10 px-4 py-8 md:px-8">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            accent="primary"
            label="Activos totales"
            value={money.format(totalAssets)}
            hint={`${accounts.filter((a) => a.value >= 0).length} cuentas`}
            series={assetsTrend}
          />
          <KpiCard
            label="Pasivos"
            value={money.format(totalLiab)}
            hint="Saldo agregado de deudas"
            series={liabTrend}
            sparkColor="var(--negative)"
          />
          <KpiCard
            label="Patrimonio"
            value={money.format(totalAssets - totalLiab)}
            hint="Activos menos pasivos"
            series={netTrend}
          />
          <KpiCard
            label="Cierres registrados"
            value={String(closureCount)}
            hint={`${accounts.length} cuentas vivas`}
          />
        </section>

        <section className="space-y-6">
          {grouped.map((g) =>
            g.rows.length === 0 ? null : (
              <SectionCard
                key={g.key}
                title={g.label}
                description={`${g.rows.length} posiciones · ${money.format1(g.total)}`}
                askPrompt={`Resume mis cuentas de tipo "${g.label}": cuáles destacan y si hay algo a vigilar.`}
              >
                <div className="overflow-hidden rounded-lg border border-border">
                  <table className="w-full text-[13px]">
                    <thead className="bg-muted/40">
                      <tr className="text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                        <th className="px-4 py-3 font-medium">Cuenta</th>
                        <th className="px-4 py-3 font-medium">Categoría</th>
                        <th className="px-4 py-3 font-medium">Plataforma</th>
                        <th className="px-4 py-3 font-medium text-right">Saldo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {g.rows.map((a) => (
                        <tr
                          key={a.id}
                          onClick={() => setSelected(a)}
                          className="cursor-pointer transition hover:bg-muted/40"
                        >
                          <td className="px-4 py-3 font-medium">{a.label}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            <Badge variant="secondary" className="font-normal">
                              {a.category ?? "—"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            <PlatformBadge name={a.platform} />
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums font-medium">
                            {money.format1(a.value)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            ),
          )}
        </section>

        <section>
          <SectionLabel>Cierres mensuales</SectionLabel>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-[13px]">
              <thead className="bg-muted/40">
                <tr className="text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Mes</th>
                  <th className="px-4 py-3 font-medium text-right">Activos</th>
                  <th className="px-4 py-3 font-medium text-right">Pasivos</th>
                  <th className="px-4 py-3 font-medium text-right">Patrimonio</th>
                  <th className="px-4 py-3 font-medium text-right">Ahorro</th>
                  <th className="px-4 py-3 font-medium text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[...data.series].reverse().map((p, i) => (
                  <tr key={p.month} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{formatMonth(p.month)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                      {money.format1(p.assets)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                      {money.format1(p.liabilities)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">
                      {money.format1(p.netWorth)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                      {money.format1(p.savings)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={
                          i === 0
                            ? "inline-flex items-center gap-1.5 rounded-full bg-warning/15 px-2 py-0.5 text-[11px] font-medium text-warning ring-1 ring-warning/30"
                            : "inline-flex items-center gap-1.5 rounded-full bg-positive/10 px-2 py-0.5 text-[11px] font-medium text-positive ring-1 ring-positive/30"
                        }
                      >
                        <span
                          className={
                            i === 0 ? "h-1.5 w-1.5 rounded-full bg-warning" : "h-1.5 w-1.5 rounded-full bg-positive"
                          }
                        />
                        {i === 0 ? "Vivo" : "Cerrado"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <HoldingDrawer
        holding={selected}
        total={totalAbs}
        open={!!selected}
        onOpenChange={(o) => (o ? null : setSelected(null))}
      />
    </AppShell>
  );
}

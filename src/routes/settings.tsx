import { createFileRoute } from "@tanstack/react-router";
import { Download, FileJson, FileSpreadsheet, Globe, User2 } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader, SectionCard, SectionLabel } from "@/components/app/SectionCard";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/app/ThemeToggle";
import { formatMonth } from "@/lib/dashboard-data";
import { useDashboard } from "@/hooks/use-dashboard";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Configuración — Wealth OS" },
      { name: "description", content: "Tipos de cambio, propietario y preferencias." },
    ],
  }),
  component: SettingsPage,
});

const fxRates = [
  { currency: "EUR", rate: 1, source: "base", updated: "—" },
  { currency: "USD", rate: 0.92, source: "manual", updated: "2026-04-30" },
  { currency: "CAD", rate: 0.68, source: "manual", updated: "2026-04-30" },
  { currency: "GBP", rate: 1.17, source: "manual", updated: "2026-04-30" },
];

function SettingsPage() {
  const data = useDashboard();

  function downloadJSON() {
    if (typeof window === "undefined") return;
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wealth-os-${data.latestMonth}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadCSV() {
    if (typeof window === "undefined") return;
    const rows = [
      ["month", "assets", "liabilities", "netWorth", "savings"],
      ...data.series.map((p) => [
        p.month,
        p.assets,
        p.liabilities,
        p.netWorth,
        p.savings,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wealth-os-series-${data.latestMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell pageEyebrow="Preferencias">
      <PageHeader
        eyebrow="Configuración"
        title="Configuración"
        description="Tipos de cambio manuales, datos del propietario, apariencia y exportación."
      />

      <div className="space-y-10 px-4 py-8 md:px-8">
        {/* Two-column intro: owner + apariencia */}
        <section className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
          <SectionCard
            title="Propietario"
            description="Identidad mostrada en cabecera y reportes."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-[12px]">
                  <User2 className="h-3.5 w-3.5 text-muted-foreground" /> Nombre
                </Label>
                <Input value={data.owner} readOnly />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-[12px]">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" /> Moneda base
                </Label>
                <Input value="EUR" readOnly />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-[12px]">Último cierre disponible</Label>
                <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2 text-[13px]">
                  <span>{formatMonth(data.latestMonth)}</span>
                  <span className="text-[11.5px] text-muted-foreground">
                    Generado {new Date(data.generatedAt).toLocaleDateString("es-ES")}
                  </span>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Apariencia"
            description="Tema y densidad visual del dashboard."
          >
            <div className="space-y-5">
              <div>
                <div className="mb-2 text-[12px] font-medium text-foreground">Tema</div>
                <ThemeToggle />
                <p className="mt-2 text-[11.5px] text-muted-foreground">
                  Se guarda en este dispositivo. Por defecto sigue al sistema.
                </p>
              </div>
              <div className="rounded-md border border-dashed border-border px-3 py-2.5 text-[11.5px] text-muted-foreground">
                Próximamente: densidad compacta, fuente alternativa y tamaño base.
              </div>
            </div>
          </SectionCard>
        </section>

        <SectionCard
          title="Tipos de cambio"
          description="Base manual a EUR usada para traducir posiciones en otras divisas al valor consolidado del dashboard."
        >
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-[13px]">
              <thead className="bg-muted/40">
                <tr className="text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Divisa</th>
                  <th className="px-4 py-3 font-medium text-right">1 unidad = EUR</th>
                  <th className="px-4 py-3 font-medium">Origen</th>
                  <th className="px-4 py-3 font-medium">Actualizado</th>
                  <th className="px-4 py-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {fxRates.map((r) => (
                  <tr key={r.currency} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{r.currency}</td>
                    <td className="px-4 py-3 text-right">
                      <Input
                        readOnly
                        defaultValue={r.rate.toString()}
                        className="ml-auto h-8 w-32 text-right tabular-nums"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={r.source === "base" ? "default" : "secondary"} className="font-normal">
                        {r.source}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{r.updated}</td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="outline" disabled>
                        Guardar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <SectionCard
            title="Exportar datos"
            description="Descarga del dataset semilla en este dispositivo."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={downloadJSON}
                className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 text-left transition hover:border-border-strong"
              >
                <FileJson className="h-5 w-5 text-muted-foreground" />
                <div className="min-w-0">
                  <div className="text-[13px] font-medium">Snapshot completo (JSON)</div>
                  <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                    Patrimonio, allocation, gastos y series.
                  </div>
                </div>
                <Download className="ml-auto h-4 w-4 self-center text-muted-foreground" />
              </button>

              <button
                type="button"
                onClick={downloadCSV}
                className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 text-left transition hover:border-border-strong"
              >
                <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                <div className="min-w-0">
                  <div className="text-[13px] font-medium">Serie mensual (CSV)</div>
                  <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                    Activos, pasivos, neto y ahorro por mes.
                  </div>
                </div>
                <Download className="ml-auto h-4 w-4 self-center text-muted-foreground" />
              </button>
            </div>
          </SectionCard>

          <SectionCard
            title="Lectura FX"
            description="Cómo se interpretan las divisas en el portfolio."
          >
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-[13px]">
                <thead className="bg-muted/40">
                  <tr className="text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Concepto</th>
                    <th className="px-4 py-3 font-medium">Interpretación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    ["EUR", "1 EUR = 1 EUR"],
                    ["USD", "Se convierte con el tipo manual actual a EUR"],
                    ["CAD", "Se convierte con el tipo manual actual a EUR"],
                    ["P/L %", "Sigue siendo válido en la divisa original"],
                  ].map(([k, v]) => (
                    <tr key={k}>
                      <td className="px-4 py-3 font-medium">{k}</td>
                      <td className="px-4 py-3 text-muted-foreground">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </section>

        <section>
          <SectionLabel>Estado del proyecto</SectionLabel>
          <div className="rounded-xl border border-warning/40 bg-warning/10 p-5 text-[13px] text-foreground">
            <div className="font-display text-base font-semibold">Modo demostración</div>
            <p className="mt-1.5 text-muted-foreground">
              Esta versión visual lee el archivo de datos semilla del proyecto. La edición de
              gastos, movimientos, portfolio y FX está deshabilitada. Para reactivar la
              persistencia, conecta el backend equivalente (Lovable Cloud o tu API original).
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

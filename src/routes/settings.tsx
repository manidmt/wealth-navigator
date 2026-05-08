import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader, SectionCard, SectionLabel } from "@/components/app/SectionCard";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { data } from "@/lib/dashboard-data";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Configuración — Wealth Studio" },
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
  return (
    <AppShell pageEyebrow="Preferencias">
      <PageHeader
        eyebrow="Configuración"
        title="Configuración"
        description="Tipos de cambio manuales, datos del propietario y preferencias del dashboard."
      />

      <div className="space-y-10 px-4 py-8 md:px-8">
        <SectionCard
          title="Propietario"
          description="Identidad mostrada en cabecera y reportes."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={data.owner} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Moneda base</Label>
              <Input value="EUR" readOnly />
            </div>
          </div>
        </SectionCard>

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
                  ["P/L %", "Sigue siendo válido en la divisa original de la posición"],
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

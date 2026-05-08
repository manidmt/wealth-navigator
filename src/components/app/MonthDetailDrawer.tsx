import { useNavigate } from "@tanstack/react-router";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AssistantMark } from "@/components/assistant/AssistantMark";
import { useMoney } from "@/components/app/CurrencyProvider";
import { DeltaBadge } from "@/components/app/DeltaBadge";
import { ExpenseTagsBreakdown } from "@/components/app/ExpenseTagsBreakdown";
import { data, formatMonth, type SeriesPoint, type ExpenseMonth } from "@/lib/dashboard-data";

type Props = {
  /** YYYY-MM identifier or null to render an empty drawer. */
  month: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function MonthDetailDrawer({ month, open, onOpenChange }: Props) {
  const money = useMoney();
  const navigate = useNavigate();

  if (!month) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-md" />
      </Sheet>
    );
  }

  const idx = data.series.findIndex((p) => p.month === month);
  const point: SeriesPoint | undefined = data.series[idx];
  const prev: SeriesPoint | undefined = idx > 0 ? data.series[idx - 1] : undefined;
  const exp: ExpenseMonth | undefined = data.expenses.byMonth.find((m) => m.month === month);
  const prevExp: ExpenseMonth | undefined =
    exp && data.expenses.byMonth.findIndex((m) => m.month === month) > 0
      ? data.expenses.byMonth[
          data.expenses.byMonth.findIndex((m) => m.month === month) - 1
        ]
      : undefined;

  const niceMonth = formatMonth(month);
  const askPrompt = `Analiza el cierre de ${niceMonth}: variación, gasto, ingresos y posibles anomalías.`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader className="gap-1">
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Cierre mensual
          </div>
          <SheetTitle className="font-display text-2xl tracking-tight">
            {niceMonth}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Detalle del cierre de {niceMonth}
          </SheetDescription>
        </SheetHeader>

        {point ? (
          <div className="mt-6 space-y-6 px-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Stat
                label="Patrimonio neto"
                value={money.format1(point.netWorth)}
                badge={
                  prev ? (
                    <DeltaBadge
                      value={
                        prev.netWorth > 0
                          ? (point.netWorth - prev.netWorth) / prev.netWorth
                          : 0
                      }
                      asPercent
                    />
                  ) : null
                }
              />
              <Stat label="Activos" value={money.format1(point.assets)} />
              <Stat label="Pasivos" value={money.format1(point.liabilities)} />
              <Stat label="Ahorro" value={money.format1(point.savings)} />
            </div>

            {exp ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Stat
                  label="Ingresos"
                  value={money.format1(exp.incomeTotal)}
                  hint={
                    prevExp
                      ? `vs ${money.format1(prevExp.incomeTotal)} anterior`
                      : undefined
                  }
                />
                <Stat
                  label="Gastos"
                  value={money.format1(exp.expenseTotal)}
                  hint={
                    prevExp
                      ? `vs ${money.format1(prevExp.expenseTotal)} anterior`
                      : undefined
                  }
                />
                <Stat
                  label="Neto del mes"
                  value={money.format1(exp.net)}
                  badge={
                    prevExp ? <DeltaBadge value={exp.net - prevExp.net} /> : null
                  }
                />
                <Stat
                  label="Tasa de ahorro"
                  value={
                    exp.incomeTotal > 0
                      ? `${((exp.net / exp.incomeTotal) * 100).toFixed(0)}%`
                      : "—"
                  }
                />
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-muted/20 p-3 text-[12px] leading-relaxed text-muted-foreground">
                No hay desglose de gastos registrado para este mes.
              </div>
            )}

            {exp ? (
              <div>
                <div className="mb-2 text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">
                  Etiquetas del mes
                </div>
                <ExpenseTagsBreakdown
                  month={month}
                  rangeMonths={data.expenses.byMonth}
                  compact
                />
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mt-6 px-4 text-[12.5px] text-muted-foreground">
            No se encontró el cierre solicitado.
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-border px-4 pt-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-[12.5px] text-muted-foreground hover:text-foreground"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={() => {
              onOpenChange(false);
              navigate({ to: "/assistant", search: { q: askPrompt } });
            }}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-[12.5px] font-medium text-primary-foreground transition hover:opacity-90"
          >
            <AssistantMark className="h-3.5 w-3.5" />
            Preguntar al asistente
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Stat({
  label,
  value,
  hint,
  badge,
}: {
  label: string;
  value: string;
  hint?: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </span>
        {badge}
      </div>
      <div className="mt-1 font-display text-base font-semibold tabular-nums text-foreground">
        {value}
      </div>
      {hint ? (
        <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div>
      ) : null}
    </div>
  );
}

import { useState } from "react";
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
import { AddMovementSheet } from "@/components/app/AddMovementSheet";
import { formatMonth, type SeriesPoint, type ExpenseMonth } from "@/lib/dashboard-data";
import { useDashboard } from "@/hooks/use-dashboard";
import { useMonthMovements, useDeleteMovement, type MovementRecord } from "@/lib/movements-api";

type Props = {
  month: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function MonthDetailDrawer({ month, open, onOpenChange }: Props) {
  const data = useDashboard();
  const money = useMoney();
  const navigate = useNavigate();
  const [addOpen, setAddOpen] = useState(false);

  const { data: movements, isLoading: movementsLoading } = useMonthMovements(month);
  const deleteMovement = useDeleteMovement();

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

  const expenses = (movements ?? []).filter((m) => m.type === "expense");
  const incomes = (movements ?? []).filter((m) => m.type === "income");

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
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

              {/* Movements list */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">
                    Movimientos
                  </span>
                  <button
                    type="button"
                    onClick={() => setAddOpen(true)}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[11.5px] font-medium text-foreground/80 transition hover:border-border-strong hover:text-foreground"
                  >
                    <span className="text-[14px] leading-none">+</span>
                    Añadir
                  </button>
                </div>

                {movementsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-10 animate-pulse rounded-lg bg-muted/40" />
                    ))}
                  </div>
                ) : (movements ?? []).length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border bg-muted/20 p-3 text-[12px] text-muted-foreground">
                    Sin movimientos registrados.{" "}
                    <button
                      type="button"
                      onClick={() => setAddOpen(true)}
                      className="underline underline-offset-2 hover:text-foreground"
                    >
                      Añadir uno
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {incomes.length > 0 && (
                      <MovementGroup
                        label="Ingresos"
                        rows={incomes}
                        month={month}
                        onDelete={(id) => deleteMovement.mutate({ id, month })}
                      />
                    )}
                    {expenses.length > 0 && (
                      <MovementGroup
                        label="Gastos"
                        rows={expenses}
                        month={month}
                        onDelete={(id) => deleteMovement.mutate({ id, month })}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-6 px-4">
              <div className="rounded-lg border border-dashed border-border bg-muted/20 p-3 text-[12px] leading-relaxed text-muted-foreground">
                No hay snapshot de patrimonio para este mes. Puedes añadir movimientos igualmente.
              </div>

              {/* Still show movements for months without a snapshot */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">
                    Movimientos
                  </span>
                  <button
                    type="button"
                    onClick={() => setAddOpen(true)}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[11.5px] font-medium text-foreground/80 transition hover:border-border-strong hover:text-foreground"
                  >
                    <span className="text-[14px] leading-none">+</span>
                    Añadir
                  </button>
                </div>
                {movementsLoading ? (
                  <div className="space-y-2">
                    {[1, 2].map((i) => (
                      <div key={i} className="h-10 animate-pulse rounded-lg bg-muted/40" />
                    ))}
                  </div>
                ) : (movements ?? []).length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border bg-muted/20 p-3 text-[12px] text-muted-foreground">
                    Sin movimientos registrados.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {incomes.length > 0 && (
                      <MovementGroup
                        label="Ingresos"
                        rows={incomes}
                        month={month}
                        onDelete={(id) => deleteMovement.mutate({ id, month })}
                      />
                    )}
                    {expenses.length > 0 && (
                      <MovementGroup
                        label="Gastos"
                        rows={expenses}
                        month={month}
                        onDelete={(id) => deleteMovement.mutate({ id, month })}
                      />
                    )}
                  </div>
                )}
              </div>
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

      <AddMovementSheet
        open={addOpen}
        onOpenChange={setAddOpen}
        defaultMonth={month}
      />
    </>
  );
}

function MovementGroup({
  label,
  rows,
  month,
  onDelete,
}: {
  label: string;
  rows: MovementRecord[];
  month: string;
  onDelete: (id: string) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">
        {label}
      </div>
      <div className="overflow-hidden rounded-lg border border-border">
        {rows.map((row, i) => (
          <div
            key={row.id}
            className={`flex items-center gap-3 px-3 py-2.5 text-[12.5px] ${
              i > 0 ? "border-t border-border" : ""
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="font-medium text-foreground">{row.category}</span>
                {row.description ? (
                  <span className="truncate text-[11px] text-muted-foreground">
                    {row.description}
                  </span>
                ) : null}
              </div>
              <div className="mt-0.5 text-[10.5px] text-muted-foreground">
                {row.date}
              </div>
            </div>
            <span
              className={`shrink-0 tabular-nums font-medium ${
                row.type === "income" ? "text-positive" : "text-foreground"
              }`}
            >
              {row.type === "income" ? "+" : "−"}
              {row.amount.toLocaleString("es-ES", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })}{" "}
              €
            </span>
            <button
              type="button"
              onClick={() => onDelete(row.id)}
              title="Eliminar"
              className="shrink-0 rounded p-1 text-muted-foreground/50 transition hover:bg-destructive/10 hover:text-destructive"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
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

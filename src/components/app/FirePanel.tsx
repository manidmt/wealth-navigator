import { useEffect, useState } from "react";
import { SectionCard } from "@/components/app/SectionCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFireSettings, useUpsertFireSettings, type FireSettings } from "@/lib/fire-api";
import { useDashboard } from "@/hooks/use-dashboard";
import { fireNumber, fireProgress, monthsToFire, estimatedFireDate } from "@/lib/fire";
import { euro, formatMonth } from "@/lib/dashboard-data";

export function FirePanel() {
  const { data: saved } = useFireSettings();
  const upsert = useUpsertFireSettings();
  const dashboard = useDashboard();

  const [form, setForm] = useState<FireSettings>({
    annual_expense: 0,
    swr_rate: 4,
    expected_return: 5,
  });
  useEffect(() => {
    if (saved) setForm(saved);
  }, [saved]);

  const recent = dashboard.expenses.byMonth.slice(-12);
  const monthlySavings =
    recent.length > 0
      ? recent.reduce((s, m) => s + (m.incomeTotal - m.expenseTotal), 0) / recent.length
      : 0;
  const netWorth = dashboard.series[dashboard.series.length - 1]?.netWorth ?? 0;

  const target = fireNumber(form.annual_expense, form.swr_rate);
  const progress = fireProgress(netWorth, target);
  const months = monthsToFire(netWorth, target, monthlySavings, form.expected_return);
  const date = months !== null ? estimatedFireDate(new Date(), months) : null;

  function update(patch: Partial<FireSettings>) {
    const next = { ...form, ...patch };
    setForm(next);
    upsert.mutate(next);
  }

  return (
    <SectionCard
      title="Independencia financiera (FIRE)"
      description="Tu número objetivo según la regla del 4% y tu ritmo de ahorro real."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1">
          <Label className="text-[12px]">Gasto anual objetivo (€)</Label>
          <Input
            type="number"
            step="100"
            value={form.annual_expense}
            onChange={(e) => update({ annual_expense: Number(e.target.value) || 0 })}
            className="text-[13px]"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[12px]">SWR (%)</Label>
          <Input
            type="number"
            step="0.1"
            value={form.swr_rate}
            onChange={(e) => update({ swr_rate: Number(e.target.value) || 0 })}
            className="text-[13px]"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[12px]">Retorno esperado (%)</Label>
          <Input
            type="number"
            step="0.1"
            value={form.expected_return}
            onChange={(e) => update({ expected_return: Number(e.target.value) || 0 })}
            className="text-[13px]"
          />
        </div>
      </div>
      <div className="mt-4 grid gap-2 rounded-md bg-muted/40 px-3 py-2.5 text-[12.5px] sm:grid-cols-2">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Número FIRE</span>
          <span className="font-semibold">{euro.format(target)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Progreso</span>
          <span className="font-semibold">{Math.round(progress * 100)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Ahorro mensual real</span>
          <span className="font-medium">{euro.format(monthlySavings)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Estimación</span>
          <span className="font-medium">
            {date ? `~${formatMonth(date)}` : "No alcanzable a este ritmo"}
          </span>
        </div>
      </div>
    </SectionCard>
  );
}

import { Link } from "@tanstack/react-router";
import { SectionCard } from "@/components/app/SectionCard";
import { useFireSettings } from "@/lib/fire-api";
import { useDashboard } from "@/hooks/use-dashboard";
import { fireNumber, fireProgress, monthsToFire, estimatedFireDate } from "@/lib/fire";
import { euro, formatMonth } from "@/lib/dashboard-data";

export function FireCard() {
  const { data: fire } = useFireSettings();
  const dashboard = useDashboard();
  const recent = dashboard.expenses.byMonth.slice(-12);
  const monthlySavings =
    recent.length > 0
      ? recent.reduce((s, m) => s + (m.incomeTotal - m.expenseTotal), 0) / recent.length
      : 0;
  const netWorth = dashboard.series[dashboard.series.length - 1]?.netWorth ?? 0;

  if (!fire || fire.annual_expense <= 0) {
    return (
      <SectionCard
        title="Independencia financiera"
        description="Define tu objetivo para ver tu progreso."
      >
        <Link to="/net-worth" className="text-[13px] font-medium text-primary hover:underline">
          Configura tu objetivo FIRE
        </Link>
      </SectionCard>
    );
  }

  const target = fireNumber(fire.annual_expense, fire.swr_rate);
  const progress = fireProgress(netWorth, target);
  const months = monthsToFire(netWorth, target, monthlySavings, fire.expected_return);
  const date = months !== null ? estimatedFireDate(new Date(), months) : null;

  return (
    <SectionCard
      title="Independencia financiera"
      description={`Objetivo ${euro.format(target)} · ahorro ${euro.format(monthlySavings)}/mes.`}
    >
      <div className="space-y-2">
        <div className="flex justify-between text-[12.5px]">
          <span className="text-muted-foreground">Progreso</span>
          <span className="font-semibold">{Math.round(progress * 100)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary" style={{ width: `${progress * 100}%` }} />
        </div>
        <div className="flex justify-between text-[12.5px]">
          <span className="text-muted-foreground">Estimación</span>
          <span className="font-medium">
            {date ? `~${formatMonth(date)}` : "No alcanzable a este ritmo"}
          </span>
        </div>
      </div>
    </SectionCard>
  );
}

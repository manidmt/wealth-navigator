import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import rawData from "@/data/dashboard-data.json";

export type Holding = {
  label: string;
  category?: string;
  platform: string;
  value: number;
};

export type SeriesPoint = {
  month: string;
  assets: number;
  liabilities: number;
  netWorth: number;
  savings: number;
};

export type ExpenseMonth = {
  month: string;
  value: number;
  expenseTotal: number;
  incomeTotal: number;
  net: number;
};

export type DashboardData = {
  owner: string;
  generatedAt: string;
  currentCalendarMonth: string;
  latestClosedMonth: string;
  latestMonth: string;
  summary: {
    totalAssets: number;
    totalLiabilities: number;
    netWorth: number;
    monthlyChange: number;
    latestSavings: number;
  };
  allocation: { label: string; value: number }[];
  platforms: { label: string; value: number }[];
  holdings: Holding[];
  portfolio: {
    holdings: Holding[];
    byPlatform: { label: string; value: number }[];
  };
  expenses: {
    currentMonth: string;
    currentMonthTotal: number;
    currentMonthIncome: number;
    currentMonthCategories: { label: string; value: number }[];
    byMonth: ExpenseMonth[];
  };
  series: SeriesPoint[];
};

export const data = rawData as DashboardData;

const ASSET_LABELS: Record<string, string> = {
  stock: "Acciones", etf: "ETF", fund: "Fondo", crypto: "Crypto",
  gold: "Oro / Metales", bond: "Bonos", broker_cash: "Cash en broker", other: "Otro",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function computeDashboard(movements: any[], positions: any[], snapshots: any[]): DashboardData {
  const now = new Date();
  const currentCalendarMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Group movements by month
  type MonthEntry = { income: number; expense: number; categories: Map<string, number> };
  const byMonthMap = new Map<string, MonthEntry>();
  for (const m of movements) {
    const month = (m.date as string).slice(0, 7);
    if (!byMonthMap.has(month)) byMonthMap.set(month, { income: 0, expense: 0, categories: new Map() });
    const entry = byMonthMap.get(month)!;
    const amount = Number(m.amount);
    if (m.type === "income") {
      entry.income += amount;
    } else {
      entry.expense += amount;
      entry.categories.set(m.category, (entry.categories.get(m.category) ?? 0) + amount);
    }
  }

  const months = [...byMonthMap.keys()].sort();
  const byMonth: ExpenseMonth[] = months.map((month) => {
    const { income, expense } = byMonthMap.get(month)!;
    return { month, value: expense, expenseTotal: expense, incomeTotal: income, net: income - expense };
  });

  const latestEntry = byMonthMap.get(months[months.length - 1] ?? currentCalendarMonth);

  // Portfolio
  const totalPortfolio = positions.reduce(
    (s: number, p: Record<string, unknown>) => s + Number(p.quantity) * Number(p.current_price),
    0,
  );

  const byPlatformMap = new Map<string, number>();
  const byCategoryMap = new Map<string, number>();
  for (const p of positions) {
    const val = Number((p as Record<string, unknown>).quantity) * Number((p as Record<string, unknown>).current_price);
    const platform = (p as Record<string, unknown>).platform as string || "Sin plataforma";
    byPlatformMap.set(platform, (byPlatformMap.get(platform) ?? 0) + val);
    const cat = (p as Record<string, unknown>).asset_type as string || "other";
    byCategoryMap.set(ASSET_LABELS[cat] ?? cat, (byCategoryMap.get(ASSET_LABELS[cat] ?? cat) ?? 0) + val);
  }

  const byPlatform = [...byPlatformMap.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  const holdings: Holding[] = positions
    .map((p: Record<string, unknown>) => ({
      label: p.asset_name as string,
      category: p.asset_type as string,
      platform: (p.platform as string) ?? "",
      value: Number(p.quantity) * Number(p.current_price),
    }))
    .sort((a, b) => b.value - a.value);

  const allocation = [...byCategoryMap.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  // Series from real snapshots (sorted by month)
  const snapshotMap = new Map<string, { netWorth: number; assets: number; liabilities: number }>();
  for (const s of snapshots) {
    snapshotMap.set(s.month as string, {
      netWorth: Number(s.net_worth),
      assets: Number(s.assets),
      liabilities: Number(s.liabilities),
    });
  }

  // Build series:
  // - If snapshots exist: use only snapshot months (real closed data). Movement-only months
  //   (open/in-progress) are excluded to avoid showing inaccurate estimates as current net worth.
  // - If no snapshots: fall back to cumulative savings from movements as an approximation.
  let series: SeriesPoint[];
  if (snapshots.length > 0) {
    series = (snapshots as Record<string, unknown>[]).map((s) => {
      const month = s.month as string;
      const movEntry = byMonthMap.get(month);
      const savings = movEntry ? movEntry.income - movEntry.expense : Number(s.savings ?? 0);
      return {
        month,
        assets: Number(s.assets),
        liabilities: Number(s.liabilities),
        netWorth: Number(s.net_worth),
        savings,
      };
    });
  } else {
    let cumSavings = 0;
    series = months.map((month) => {
      const movEntry = byMonthMap.get(month)!;
      const movNet = movEntry.income - movEntry.expense;
      cumSavings += movNet;
      return { month, assets: totalPortfolio + Math.max(0, cumSavings), liabilities: 0, netWorth: totalPortfolio + cumSavings, savings: movNet };
    });
  }

  const latestSnap = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
  const latestClosedMonth = latestSnap
    ? (latestSnap.month as string)
    : (months[months.length - 1] ?? currentCalendarMonth);

  // Estimate current total assets:
  // Take the last snapshot's total (which includes cash, real estate, everything),
  // then apply only the portfolio delta since that close.
  // This avoids counting just the investment portfolio and missing other assets.
  const snapPortfolioValue = latestSnap ? Number((latestSnap as Record<string, unknown>).portfolio_value ?? latestSnap.assets) : 0;
  const portfolioDelta = latestSnap ? totalPortfolio - snapPortfolioValue : 0;
  const liveAssets = latestSnap ? Number(latestSnap.assets) + portfolioDelta : totalPortfolio;
  const liveLiabilities = latestSnap ? Number(latestSnap.liabilities) : 0;
  const liveNetWorth = liveAssets + liveLiabilities;

  // Always include the current calendar month as a live entry.
  if (!series.some((s) => s.month === currentCalendarMonth)) {
    const movEntry = byMonthMap.get(currentCalendarMonth);
    series.push({
      month: currentCalendarMonth,
      assets: liveAssets,
      liabilities: liveLiabilities,
      netWorth: liveNetWorth,
      savings: movEntry ? movEntry.income - movEntry.expense : 0,
    });
    series.sort((a, b) => a.month.localeCompare(b.month));
  }

  const monthlyChange = latestSnap
    ? liveNetWorth - Number(latestSnap.net_worth)
    : (latestEntry ? latestEntry.income - latestEntry.expense : 0);

  // Current month expenses always reference the current calendar month.
  const currentMovEntry = byMonthMap.get(currentCalendarMonth);
  const currentMonthCats = currentMovEntry
    ? [...currentMovEntry.categories.entries()]
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value)
    : [];

  return {
    owner: "me",
    generatedAt: new Date().toISOString(),
    currentCalendarMonth,
    latestClosedMonth,
    latestMonth: currentCalendarMonth,
    summary: {
      totalAssets: liveAssets,
      totalLiabilities: liveLiabilities,
      netWorth: liveNetWorth,
      monthlyChange,
      latestSavings: currentMovEntry ? currentMovEntry.income - currentMovEntry.expense : 0,
    },
    allocation,
    platforms: byPlatform,
    holdings,
    portfolio: { holdings, byPlatform },
    expenses: {
      currentMonth: currentCalendarMonth,
      currentMonthTotal: currentMovEntry?.expense ?? 0,
      currentMonthIncome: currentMovEntry?.income ?? 0,
      currentMonthCategories: currentMonthCats,
      byMonth,
    },
    series,
  };
}

export function useLiveDashboardData() {
  const { user } = useAuth();
  return useQuery<DashboardData>({
    queryKey: ["dashboard-snapshot", user?.id],
    queryFn: async () => {
      const [{ data: movements, error: movErr }, { data: positions, error: posErr }, { data: snapshots, error: snapErr }] =
        await Promise.all([
          supabase.from("movements").select("type, date, category, amount, currency").order("date"),
          supabase.from("portfolio_positions").select("*"),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any).from("monthly_snapshots").select("month, assets, liabilities, net_worth, savings, portfolio_value").order("month"),
        ]);
      if (movErr) throw movErr;
      if (posErr) throw posErr;
      if (snapErr) throw snapErr;
      return computeDashboard(movements ?? [], positions ?? [], snapshots ?? []);
    },
    enabled: !!user,
    placeholderData: rawData as DashboardData,
    staleTime: 30_000,
  });
}

export const euro = new Intl.NumberFormat("es-ES", {
  style: "currency", currency: "EUR", maximumFractionDigits: 0,
});

export const euro1 = new Intl.NumberFormat("es-ES", {
  style: "currency", currency: "EUR", maximumFractionDigits: 1,
});

export const euro2 = new Intl.NumberFormat("es-ES", {
  style: "currency", currency: "EUR", maximumFractionDigits: 2,
});

export const pct = new Intl.NumberFormat("es-ES", {
  style: "percent", maximumFractionDigits: 1,
});

export function formatPercent(value: number) {
  return pct.format(value);
}

export function formatMonth(month: string) {
  const [y, m] = month.split("-").map(Number);
  if (!y || !m) return month;
  return new Date(y, m - 1, 1).toLocaleDateString("es-ES", { month: "short", year: "numeric" });
}

export function monthShort(month: string) {
  const [, m] = month.split("-").map(Number);
  return ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"][
    (m ?? 1) - 1
  ];
}

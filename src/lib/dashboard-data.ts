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

  const latestMonth = months[months.length - 1] ?? currentCalendarMonth;
  const latestEntry = byMonthMap.get(latestMonth);

  const currentMonthCategories = latestEntry
    ? [...latestEntry.categories.entries()]
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value)
    : [];

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

  // Build series: prefer snapshot data, fall back to cumulative savings estimate
  const allMonths = [...new Set([...snapshotMap.keys(), ...months])].sort();
  let cumSavings = 0;
  const series: SeriesPoint[] = allMonths.map((month) => {
    const snap = snapshotMap.get(month);
    const movEntry = byMonthMap.get(month);
    const movNet = movEntry ? movEntry.income - movEntry.expense : 0;
    if (movEntry) cumSavings += movNet;
    const savings = movNet;
    if (snap) {
      return { month, assets: snap.assets, liabilities: snap.liabilities, netWorth: snap.netWorth, savings };
    }
    return { month, assets: totalPortfolio + Math.max(0, cumSavings), liabilities: 0, netWorth: totalPortfolio + cumSavings, savings };
  });

  const latestSnap = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
  const latestNetWorth = latestSnap ? Number(latestSnap.net_worth) : totalPortfolio;
  const prevSnap = snapshots.length > 1 ? snapshots[snapshots.length - 2] : null;
  const monthlyChange = latestSnap && prevSnap
    ? Number(latestSnap.net_worth) - Number(prevSnap.net_worth)
    : (latestEntry ? latestEntry.income - latestEntry.expense : 0);

  return {
    owner: "me",
    generatedAt: new Date().toISOString(),
    currentCalendarMonth,
    latestClosedMonth: latestMonth,
    latestMonth,
    summary: {
      totalAssets: latestSnap ? Number(latestSnap.assets) : totalPortfolio,
      totalLiabilities: latestSnap ? Number(latestSnap.liabilities) : 0,
      netWorth: latestNetWorth,
      monthlyChange,
      latestSavings: latestSnap ? Number(latestSnap.savings) : (latestEntry ? latestEntry.income - latestEntry.expense : 0),
    },
    allocation,
    platforms: byPlatform,
    holdings,
    portfolio: { holdings, byPlatform },
    expenses: {
      currentMonth: latestMonth,
      currentMonthTotal: latestEntry?.expense ?? 0,
      currentMonthIncome: latestEntry?.income ?? 0,
      currentMonthCategories,
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

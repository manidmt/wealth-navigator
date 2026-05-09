import { useQuery } from "@tanstack/react-query";
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

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";

export async function fetchDashboardData(): Promise<DashboardData> {
  const res = await fetch(`${API_BASE}/api/dashboard-snapshot`);
  if (!res.ok) throw new Error(`dashboard-snapshot HTTP ${res.status}`);
  return res.json() as Promise<DashboardData>;
}

export function useLiveDashboardData() {
  return useQuery({
    queryKey: ["dashboard-snapshot"],
    queryFn: fetchDashboardData,
    initialData: rawData as DashboardData,
    staleTime: 60_000,
  });
}

export const euro = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export const euro1 = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 1,
});

export const euro2 = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

export const pct = new Intl.NumberFormat("es-ES", {
  style: "percent",
  maximumFractionDigits: 1,
});

export function formatPercent(value: number) {
  return pct.format(value);
}

export function formatMonth(month: string) {
  const [y, m] = month.split("-").map(Number);
  if (!y || !m) return month;
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("es-ES", { month: "short", year: "numeric" });
}

export function monthShort(month: string) {
  const [, m] = month.split("-").map(Number);
  return ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"][
    (m ?? 1) - 1
  ];
}

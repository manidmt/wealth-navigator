import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";

export type PortfolioAssetType =
  | "stock"
  | "etf"
  | "fund"
  | "crypto"
  | "gold"
  | "broker_cash"
  | "other";

export type PortfolioPosition = {
  id: string;
  assetId: string;
  assetName: string;
  ticker: string;
  isin: string;
  assetType: PortfolioAssetType;
  platform: string;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  currency: string;
  notes: string;
  openedAt: string;
  updatedAt: string;
  priceUpdatedAt: string | null;
  priceSource: string;
  rateToEur: number;
  costBasis: number;
  marketValue: number;
  pnlValue: number;
  pnlPct: number | null;
  costBasisEur: number;
  marketValueEur: number;
  pnlValueEur: number;
  portfolioWeight: number;
};

export const ASSET_TYPE_LABELS: Record<PortfolioAssetType, string> = {
  stock: "Acciones",
  etf: "ETF",
  fund: "Fondo",
  crypto: "Crypto",
  gold: "Oro / Metales",
  broker_cash: "Cash en broker",
  other: "Otro",
};

export const COMMON_PLATFORMS = [
  "Trade Republic",
  "MyInvestor",
  "IBKR",
  "Criptan",
  "Revolut",
  "BBVA",
  "N26",
  "Degiro",
  "Interactive Brokers",
];

export const COMMON_CURRENCIES = ["EUR", "USD", "GBP", "CAD", "CHF"];

async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, init);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export function usePortfolioPositions() {
  return useQuery<PortfolioPosition[]>({
    queryKey: ["portfolio-positions"],
    queryFn: async () => {
      const data = await apiFetch("/api/portfolio");
      return (data.rows ?? []) as PortfolioPosition[];
    },
    staleTime: 30_000,
  });
}

export type CreatePositionInput = {
  assetName: string;
  ticker?: string;
  isin?: string;
  assetType: PortfolioAssetType;
  platform: string;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  currency?: string;
  notes?: string;
  date?: string;
};

export function useCreatePosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePositionInput) =>
      apiFetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["portfolio-positions"] });
      qc.invalidateQueries({ queryKey: ["dashboard-snapshot"] });
    },
  });
}

export function useUpdatePosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...patch
    }: { id: string } & Partial<CreatePositionInput>) =>
      apiFetch(`/api/portfolio/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["portfolio-positions"] });
      qc.invalidateQueries({ queryKey: ["dashboard-snapshot"] });
    },
  });
}

export function useDeletePosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/portfolio/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["portfolio-positions"] });
      qc.invalidateQueries({ queryKey: ["dashboard-snapshot"] });
    },
  });
}

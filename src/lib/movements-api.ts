import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";

export type MovementType = "expense" | "income";

export type MovementRecord = {
  id: string;
  type: MovementType;
  date: string;
  month: string;
  category: string;
  account: string;
  description: string;
  amount: number;
  currency: string;
  source: string;
};

export type CreateMovementInput = {
  type: MovementType;
  date: string;
  category: string;
  description?: string;
  account?: string;
  amount: number;
  currency?: string;
};

export const EXPENSE_CATEGORIES = [
  "Café", "Coche", "Comer fuera", "Comida", "Cuidado personal",
  "Deporte", "Educación", "Formación", "Gestiones", "Gimnasio",
  "Higiene", "Hogar", "Impuestos", "Ocio", "Otro",
  "Regalo", "Ropa", "Salud", "Suplementos", "Suscripciones",
  "Tecnología", "Transporte", "Viaje",
];

export const INCOME_CATEGORIES = [
  "Nómina", "Salario", "Extra", "Tarjeta Restaurante",
  "Ticket restaurante", "Comer fuera", "Otros ingresos",
];

async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, init);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export function useMonthMovements(month: string | null) {
  return useQuery<MovementRecord[]>({
    queryKey: ["month-movements", month],
    queryFn: async () => {
      const data = await apiFetch(`/api/expenses?month=${month}`);
      return (data.rows ?? []) as MovementRecord[];
    },
    enabled: !!month,
    staleTime: 15_000,
  });
}

export function useCreateMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMovementInput) =>
      apiFetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    onSuccess: (_data, input) => {
      qc.invalidateQueries({ queryKey: ["month-movements", input.date.slice(0, 7)] });
      qc.invalidateQueries({ queryKey: ["dashboard-snapshot"] });
    },
  });
}

export function useUpdateMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      month,
      ...patch
    }: { id: string; month: string } & Partial<CreateMovementInput>) =>
      apiFetch(`/api/expenses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      }),
    onSuccess: (_data, { month }) => {
      qc.invalidateQueries({ queryKey: ["month-movements", month] });
      qc.invalidateQueries({ queryKey: ["dashboard-snapshot"] });
    },
  });
}

export function useDeleteMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; month: string }) =>
      apiFetch(`/api/expenses/${id}`, { method: "DELETE" }),
    onSuccess: (_data, { month }) => {
      qc.invalidateQueries({ queryKey: ["month-movements", month] });
      qc.invalidateQueries({ queryKey: ["dashboard-snapshot"] });
    },
  });
}

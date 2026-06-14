import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { IncomeItem, BudgetMap } from "./budget-calc";

export type MonthlyBudget = {
  id: string;
  user_id: string;
  month: string; // 'YYYY-MM'
  incomes: IncomeItem[];
  savings_goal: number;
  budgets: BudgetMap;
  created_at: string;
};

export function useBudget(month: string) {
  const { user } = useAuth();
  return useQuery<MonthlyBudget | null>({
    queryKey: ["monthly_budgets", month, user?.id],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("monthly_budgets")
        .select("*")
        .eq("month", month)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return { ...data, savings_goal: Number(data.savings_goal) } as MonthlyBudget;
    },
    enabled: !!user,
  });
}

export function useUpsertBudget() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      month: string;
      incomes: IncomeItem[];
      savings_goal: number;
      budgets: BudgetMap;
    }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("monthly_budgets")
        .upsert({ ...input, user_id: user!.id }, { onConflict: "user_id,month" });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["monthly_budgets", vars.month] }),
  });
}

export function useDuplicateBudget() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { from: string; to: string }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: src, error: e1 } = await (supabase as any)
        .from("monthly_budgets")
        .select("*")
        .eq("month", input.from)
        .maybeSingle();
      if (e1) throw e1;
      if (!src) throw new Error("No hay planificación en el mes anterior para duplicar.");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: e2 } = await (supabase as any).from("monthly_budgets").upsert(
        {
          user_id: user!.id,
          month: input.to,
          incomes: src.incomes,
          savings_goal: src.savings_goal,
          budgets: src.budgets,
        },
        { onConflict: "user_id,month" },
      );
      if (e2) throw e2;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["monthly_budgets", vars.to] }),
  });
}

/** Gasto real del mes por categoría (expense, no excluido). */
export function useMonthCategorySpend(month: string) {
  const { user } = useAuth();
  return useQuery<{ category: string; amount: number }[]>({
    queryKey: ["month_category_spend", month, user?.id],
    queryFn: async () => {
      const start = `${month}-01`;
      const [y, m] = month.split("-").map(Number);
      const next = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("movements")
        .select("category, amount")
        .eq("type", "expense")
        .eq("excluded", false)
        .gte("date", start)
        .lt("date", next);
      if (error) throw error;
      return (data ?? []).map((r) => ({
        category: (r.category as string) ?? "Otro",
        amount: Number(r.amount) || 0,
      }));
    },
    enabled: !!user,
  });
}

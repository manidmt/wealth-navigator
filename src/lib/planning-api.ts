import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type RuleType = "fixed" | "pct_income" | "pct_savings" | "event";
export type Frequency = "monthly" | "quarterly";

export type InvestmentPlan = {
  id: string;
  user_id: string;
  name: string;
  asset_name: string;
  rule_type: RuleType;
  amount: number | null;
  percentage: number | null;
  frequency: Frequency;
  return_pessimistic: number;
  return_base: number;
  return_optimistic: number;
  start_date: string;
  active: boolean;
  notes: string | null;
  created_at: string;
};

export type PlanContribution = {
  id: string;
  user_id: string;
  plan_id: string;
  date: string;
  planned_amount: number;
  actual_amount: number | null;
  created_at: string;
};

export type CreatePlanInput = Omit<InvestmentPlan, "id" | "user_id" | "created_at">;
export type UpdatePlanInput = Partial<CreatePlanInput> & { id: string };

// ── Plans ──────────────────────────────────────────────────────────────────

export function useInvestmentPlans() {
  const { user } = useAuth();
  return useQuery<InvestmentPlan[]>({
    queryKey: ["investment_plans", user?.id],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("investment_plans")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
}

export function useCreatePlan() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreatePlanInput) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("investment_plans")
        .insert({ ...input, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["investment_plans"] }),
  });
}

export function useUpdatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...rest }: UpdatePlanInput) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("investment_plans")
        .update(rest)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["investment_plans"] }),
  });
}

export function useDeletePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("investment_plans")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["investment_plans"] }),
  });
}

// ── Contributions ──────────────────────────────────────────────────────────

export function usePlanContributions(planId: string | null) {
  const { user } = useAuth();
  return useQuery<PlanContribution[]>({
    queryKey: ["plan_contributions", planId],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("plan_contributions")
        .select("*")
        .eq("plan_id", planId)
        .order("date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user && !!planId,
  });
}

export function useUpsertContribution() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      plan_id: string;
      date: string;
      planned_amount: number;
      actual_amount: number;
    }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("plan_contributions")
        .upsert({ ...input, user_id: user!.id }, { onConflict: "plan_id,date" });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["plan_contributions", vars.plan_id] });
    },
  });
}

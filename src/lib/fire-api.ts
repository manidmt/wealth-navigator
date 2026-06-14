import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type FireSettings = {
  annual_expense: number;
  swr_rate: number;
  expected_return: number;
};

const DEFAULTS: FireSettings = { annual_expense: 0, swr_rate: 4, expected_return: 5 };

export function useFireSettings() {
  const { user } = useAuth();
  return useQuery<FireSettings>({
    queryKey: ["fire_settings", user?.id],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("fire_settings")
        .select("annual_expense, swr_rate, expected_return")
        .maybeSingle();
      if (error) throw error;
      if (!data) return DEFAULTS;
      return {
        annual_expense: Number(data.annual_expense) || 0,
        swr_rate: Number(data.swr_rate) || 4,
        expected_return: Number(data.expected_return) || 5,
      };
    },
    enabled: !!user,
  });
}

export function useUpsertFireSettings() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: FireSettings) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("fire_settings")
        .upsert(
          { ...input, user_id: user!.id, updated_at: new Date().toISOString() },
          { onConflict: "user_id" },
        );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fire_settings"] }),
  });
}

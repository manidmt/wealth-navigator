import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type BankConnectionStatus = "pending" | "active" | "expired" | "error";

export type BankConnection = {
  id: string;
  user_id: string;
  institution_id: string;
  institution_name: string;
  requisition_id: string;
  account_ids: string[];
  status: BankConnectionStatus;
  last_synced_at: string | null;
  error_message: string | null;
  created_at: string;
};

export type Institution = { id: string; name: string };

// Verify IDs with: GET /api/v2/institutions/?country=ES after Task 1 Step 6
export const INSTITUTIONS: Institution[] = [
  { id: "BBVA_ES_BBVAESMMXXX", name: "BBVA" },
  { id: "N26_NTSBDEB1XXX", name: "N26" },
  { id: "REVOLUT_REVOGB21", name: "Revolut" },
  { id: "INGDDEFFXXX_ES", name: "ING" },
  { id: "SANTANDER_BSCHESMM", name: "Santander" },
  { id: "CAIXABANK_CAIXESBBXXX", name: "CaixaBank" },
  { id: "MYINVESTOR_ES", name: "MyInvestor" },
  { id: "TRADE_REPUBLIC_TRPUDEB1XXX", name: "Trade Republic" },
];

export function useBankConnections() {
  const { user } = useAuth();
  return useQuery<BankConnection[]>({
    queryKey: ["bank_connections", user?.id],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("bank_connections")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
}

export function useConnectBank() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (institution: Institution): Promise<{ link: string; requisition_id: string }> => {
      const { data, error } = await supabase.functions.invoke("bank-connect", {
        body: { institution_id: institution.id, institution_name: institution.name },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bank_connections"] }),
  });
}

export function useSyncBank() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (connectionId?: string) => {
      const { data, error } = await supabase.functions.invoke("bank-sync", {
        body: connectionId ? { connection_id: connectionId } : {},
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data as { ok: boolean; synced: number; inserted: number };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank_connections"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-snapshot"] });
    },
  });
}

export function useDisconnectBank() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (connectionId: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("bank_connections")
        .delete()
        .eq("id", connectionId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bank_connections"] }),
  });
}

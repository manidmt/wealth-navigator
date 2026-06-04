import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, corsResponse } from "../_shared/cors.ts";
import { getToken, getRequisition, getTransactions } from "../_shared/gocardless.ts";

function mapTransaction(tx: Record<string, unknown>, userId: string) {
  const amountRaw = (tx.transactionAmount as { amount: string; currency: string });
  const amount = parseFloat(amountRaw.amount);
  const isIncome = amount > 0;
  const description =
    (tx.remittanceInformationUnstructured as string) ??
    (tx.creditorName as string) ??
    (tx.debtorName as string) ??
    "Sin descripción";
  return {
    user_id: userId,
    date: (tx.bookingDate ?? tx.valueDate) as string,
    type: isIncome ? "income" : "expense",
    amount: Math.abs(amount),
    currency: amountRaw.currency,
    description: description.trim().slice(0, 200),
    category: "Sin categoría",
    external_id: tx.transactionId as string,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } },
    );
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return corsResponse({ error: "Unauthorized" }, 401);

    const { requisition_id } = await req.json() as { requisition_id: string };
    const token = await getToken();
    const requisition = await getRequisition(token, requisition_id);

    if (!requisition.accounts?.length) {
      await supabase.from("bank_connections")
        .update({ status: "error", error_message: "No accounts returned" })
        .eq("requisition_id", requisition_id);
      return corsResponse({ error: "No accounts linked" }, 400);
    }

    await supabase.from("bank_connections")
      .update({ account_ids: requisition.accounts, status: "active", error_message: null })
      .eq("requisition_id", requisition_id);

    // Initial sync: fetch last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const dateFrom = ninetyDaysAgo.toISOString().slice(0, 10);

    let inserted = 0;
    for (const accountId of requisition.accounts) {
      const txs = await getTransactions(token, accountId, dateFrom);
      if (!txs.length) continue;
      const rows = (txs as Record<string, unknown>[])
        .filter((tx) => tx.transactionId)
        .map((tx) => mapTransaction(tx, user.id));
      const { error } = await supabase.from("movements").upsert(rows, { onConflict: "external_id", ignoreDuplicates: true });
      if (error) console.error("upsert error:", error.message);
      else inserted += rows.length;
    }

    await supabase.from("bank_connections")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("requisition_id", requisition_id);

    return corsResponse({ ok: true, accounts: requisition.accounts.length, inserted });
  } catch (e) {
    console.error(e);
    return corsResponse({ error: (e as Error).message }, 500);
  }
});

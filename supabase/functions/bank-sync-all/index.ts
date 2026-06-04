import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsResponse } from "../_shared/cors.ts";
import { getToken, getTransactions } from "../_shared/gocardless.ts";

function mapTransaction(tx: Record<string, unknown>, userId: string) {
  const amountRaw = tx.transactionAmount as { amount: string; currency: string };
  const amount = parseFloat(amountRaw.amount);
  const description =
    (tx.remittanceInformationUnstructured as string) ??
    (tx.creditorName as string) ??
    (tx.debtorName as string) ??
    "Sin descripción";
  return {
    user_id: userId,
    date: (tx.bookingDate ?? tx.valueDate) as string,
    type: amount > 0 ? "income" : "expense",
    amount: Math.abs(amount),
    currency: amountRaw.currency,
    description: description.trim().slice(0, 200),
    category: "Sin categoría",
    external_id: tx.transactionId as string,
  };
}

serve(async (req) => {
  // Only accept calls from Supabase scheduler (service role key in Authorization)
  const authHeader = req.headers.get("Authorization") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  if (!authHeader.includes(serviceKey.slice(-20))) {
    return corsResponse({ error: "Forbidden" }, 403);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    serviceKey,
  );

  try {
    const token = await getToken();
    const { data: connections } = await supabase
      .from("bank_connections")
      .select("*")
      .eq("status", "active");

    let totalInserted = 0;
    for (const conn of connections ?? []) {
      const dateFrom = conn.last_synced_at
        ? conn.last_synced_at.slice(0, 10)
        : new Date(Date.now() - 90 * 86400_000).toISOString().slice(0, 10);

      for (const accountId of conn.account_ids as string[]) {
        const txs = await getTransactions(token, accountId, dateFrom);
        if (!txs.length) continue;
        const rows = (txs as Record<string, unknown>[])
          .filter((tx) => tx.transactionId)
          .map((tx) => mapTransaction(tx, conn.user_id));
        const { error } = await supabase.from("movements").upsert(rows, { onConflict: "external_id", ignoreDuplicates: true });
        if (!error) totalInserted += rows.length;
      }
      await supabase.from("bank_connections")
        .update({ last_synced_at: new Date().toISOString() })
        .eq("id", conn.id);
    }

    return corsResponse({ ok: true, connections: (connections ?? []).length, inserted: totalInserted });
  } catch (e) {
    console.error(e);
    return corsResponse({ error: (e as Error).message }, 500);
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, corsResponse } from "../_shared/cors.ts";
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

async function syncConnection(
  supabase: ReturnType<typeof createClient>,
  conn: { id: string; account_ids: string[]; last_synced_at: string | null; user_id: string },
  token: string,
) {
  const dateFrom = conn.last_synced_at
    ? conn.last_synced_at.slice(0, 10)
    : new Date(Date.now() - 90 * 86400_000).toISOString().slice(0, 10);

  let inserted = 0;
  for (const accountId of conn.account_ids as string[]) {
    const txs = await getTransactions(token, accountId, dateFrom);
    if (!txs.length) continue;
    const rows = (txs as Record<string, unknown>[])
      .filter((tx) => tx.transactionId)
      .map((tx) => mapTransaction(tx, conn.user_id));
    const { error } = await supabase.from("movements").upsert(rows, { onConflict: "external_id", ignoreDuplicates: true });
    if (!error) inserted += rows.length;
  }
  await supabase.from("bank_connections")
    .update({ last_synced_at: new Date().toISOString(), error_message: null })
    .eq("id", conn.id);
  return inserted;
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

    const body = req.headers.get("content-length") !== "0" ? await req.json().catch(() => ({})) : {};
    const connectionId = (body as { connection_id?: string }).connection_id;

    let query = supabase.from("bank_connections").select("*").eq("status", "active").eq("user_id", user.id);
    if (connectionId) query = query.eq("id", connectionId) as typeof query;
    const { data: connections, error: connErr } = await query;
    if (connErr) return corsResponse({ error: connErr.message }, 500);

    const token = await getToken();
    let totalInserted = 0;
    for (const conn of connections ?? []) {
      totalInserted += await syncConnection(supabase, conn, token);
    }

    return corsResponse({ ok: true, synced: (connections ?? []).length, inserted: totalInserted });
  } catch (e) {
    console.error(e);
    return corsResponse({ error: (e as Error).message }, 500);
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, corsResponse } from "../_shared/cors.ts";
import { getAllTransactions } from "../_shared/enablebanking.ts";
import { mapTransaction, isBooked } from "../_shared/bank-mapping.ts";

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

    let inserted = 0;
    for (const conn of connections ?? []) {
      const dateFrom = conn.last_synced_at
        ? (conn.last_synced_at as string).slice(0, 10)
        : new Date(Date.now() - 90 * 86400_000).toISOString().slice(0, 10);
      for (const uid of (conn.account_ids as string[])) {
        const txs = (await getAllTransactions(uid, dateFrom)).filter(isBooked).filter((t) => t.transaction_id || t.entry_reference);
        if (!txs.length) continue;
        const rows = txs.map((t) => mapTransaction(t, conn.user_id as string));
        const { error } = await supabase.from("movements").upsert(rows, { onConflict: "external_id", ignoreDuplicates: true });
        if (!error) inserted += rows.length;
      }
      await supabase.from("bank_connections")
        .update({ last_synced_at: new Date().toISOString(), error_message: null })
        .eq("id", conn.id);
    }
    return corsResponse({ ok: true, synced: (connections ?? []).length, inserted });
  } catch (e) {
    return corsResponse({ error: (e as Error).message }, 500);
  }
});

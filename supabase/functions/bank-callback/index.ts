import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, corsResponse } from "../_shared/cors.ts";
import { createSession, getAllTransactions } from "../_shared/enablebanking.ts";
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

    const { code, state } = await req.json() as { code: string; state: string };
    const session = await createSession(code);
    const uids = session.accounts.map((a) => a.uid);
    const expires = new Date(Date.now() + 180 * 86400_000).toISOString();

    await supabase.from("bank_connections")
      .update({
        requisition_id: session.session_id,
        account_ids: uids,
        status: "active",
        error_message: null,
        session_expires_at: expires,
      })
      .eq("auth_state", state)
      .eq("user_id", user.id);

    const dateFrom = new Date(Date.now() - 90 * 86400_000).toISOString().slice(0, 10);
    let inserted = 0;
    for (const uid of uids) {
      const txs = (await getAllTransactions(uid, dateFrom)).filter(isBooked).filter((t) => t.transaction_id || t.entry_reference);
      if (!txs.length) continue;
      const rows = txs.map((t) => mapTransaction(t, user.id));
      const { error } = await supabase.from("movements").upsert(rows, { onConflict: "external_id", ignoreDuplicates: true });
      if (!error) inserted += rows.length;
    }
    await supabase.from("bank_connections").update({ last_synced_at: new Date().toISOString() }).eq("auth_state", state);

    return corsResponse({ ok: true, accounts: uids.length, inserted });
  } catch (e) {
    return corsResponse({ error: (e as Error).message }, 500);
  }
});

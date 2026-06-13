import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, corsResponse } from "../_shared/cors.ts";
import { getAllTransactions } from "../_shared/enablebanking.ts";
import { mapTransaction, isBooked } from "../_shared/bank-mapping.ts";
import { findDuplicate, type DedupRow } from "../_shared/dedup.ts";
import { classifyBatch } from "../_shared/llm-classify.ts";

// EXPENSE_CATEGORIES / INCOME_CATEGORIES (copiadas de src/lib/movements-api.ts; mantener sincronizadas)
const EXPENSE_CATEGORIES = ["Café","Coche","Comer fuera","Comida","Cuidado personal","Deporte","Educación","Formación","Gestiones","Gimnasio","Higiene","Hogar","Impuestos","Ocio","Otro","Regalo","Ropa","Salud","Suplementos","Suscripciones","Tecnología","Transporte","Viaje"];
const INCOME_CATEGORIES = ["Nómina","Salario","Extra","Tarjeta Restaurante","Ticket restaurante","Comer fuera","Otros ingresos"];

// dado: rows: MovementRow[] (de mapTransaction), userId: string, supabase, dateFrom: string
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function enrichRows(supabase: any, rows: any[], userId: string, dateFrom: string) {
  // 1. duplicados contra manuales (external_id null) del usuario en el rango
  const { data: manualsRaw } = await supabase
    .from("movements")
    .select("id, amount, type, date")
    .is("external_id", null)
    .eq("user_id", userId)
    .gte("date", dateFrom);
  const manuals: DedupRow[] = (manualsRaw ?? []).map((m: any) => ({
    id: m.id, amount: Number(m.amount), type: m.type, date: m.date,
  }));
  for (const r of rows) {
    const dup = findDuplicate({ amount: r.amount, type: r.type, date: r.date }, manuals);
    r.duplicate_of = dup;
    r.excluded = dup !== null; // duplicado sospechoso no cuenta hasta revisar
  }
  // 2. capa LLM para las sin categoría, separando por tipo
  for (const type of ["expense", "income"] as const) {
    const pending = rows.filter((r) => r.type === type && r.category === "Sin categoría");
    if (pending.length === 0) continue;
    const cats = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    const items = pending.map((r, i) => ({ id: String(i), description: r.description }));
    const result = await classifyBatch(items, cats);
    pending.forEach((r, i) => { r.category = result[String(i)] ?? "Sin categoría"; });
  }
  return rows;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: connections, error } = await supabase.from("bank_connections").select("*").eq("status", "active");
    if (error) return corsResponse({ error: error.message }, 500);

    let inserted = 0;
    for (const conn of connections ?? []) {
      const dateFrom = conn.last_synced_at
        ? (conn.last_synced_at as string).slice(0, 10)
        : new Date(Date.now() - 90 * 86400_000).toISOString().slice(0, 10);
      for (const uid of (conn.account_ids as string[])) {
        const txs = (await getAllTransactions(uid, dateFrom)).filter(isBooked).filter((t) => t.transaction_id || t.entry_reference);
        if (!txs.length) continue;
        const rows = txs.map((t) => mapTransaction(t, conn.user_id as string));
        const enriched = await enrichRows(supabase, rows, conn.user_id as string, dateFrom);
        const { error: upErr } = await supabase.from("movements").upsert(enriched, { onConflict: "external_id", ignoreDuplicates: true });
        if (upErr) {
          await supabase.from("bank_connections").update({ error_message: `sync: ${upErr.message}` }).eq("id", conn.id);
        } else {
          inserted += enriched.length;
        }
      }
      await supabase.from("bank_connections").update({ last_synced_at: new Date().toISOString() }).eq("id", conn.id);
    }
    return corsResponse({ ok: true, synced: (connections ?? []).length, inserted });
  } catch (e) {
    return corsResponse({ error: (e as Error).message }, 500);
  }
});

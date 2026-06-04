import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, corsResponse } from "../_shared/cors.ts";
import { getToken, createRequisition } from "../_shared/gocardless.ts";

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

    const { institution_id, institution_name } = await req.json() as {
      institution_id: string;
      institution_name: string;
    };

    const token = await getToken();
    const reference = `${user.id.slice(0, 8)}_${Date.now()}`;
    const redirectUrl = `${Deno.env.get("APP_URL") ?? "https://wealthos.manidmt.es"}/bank-callback`;

    const requisition = await createRequisition(token, institution_id, reference, redirectUrl);

    await supabase.from("bank_connections").upsert(
      {
        user_id: user.id,
        institution_id,
        institution_name,
        requisition_id: requisition.id,
        account_ids: [],
        status: "pending",
      },
      { onConflict: "user_id,institution_id" },
    );

    return corsResponse({ link: requisition.link, requisition_id: requisition.id });
  } catch (e) {
    console.error(e);
    return corsResponse({ error: (e as Error).message }, 500);
  }
});

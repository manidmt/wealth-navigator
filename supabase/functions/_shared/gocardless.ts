const GC_BASE = "https://bankaccountdata.gocardless.com/api/v2";

export async function getToken(): Promise<string> {
  const resp = await fetch(`${GC_BASE}/token/new/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({
      secret_id: Deno.env.get("GOCARDLESS_SECRET_ID"),
      secret_key: Deno.env.get("GOCARDLESS_SECRET_KEY"),
    }),
  });
  if (!resp.ok) throw new Error(`GoCardless token error: ${await resp.text()}`);
  const { access } = await resp.json();
  return access as string;
}

export async function createRequisition(
  token: string,
  institutionId: string,
  reference: string,
  redirectUrl: string,
) {
  const resp = await fetch(`${GC_BASE}/requisitions/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      redirect: redirectUrl,
      institution_id: institutionId,
      reference,
      language: "ES",
    }),
  });
  if (!resp.ok) throw new Error(`Create requisition error: ${await resp.text()}`);
  return resp.json() as Promise<{ id: string; link: string; status: string }>;
}

export async function getRequisition(token: string, requisitionId: string) {
  const resp = await fetch(`${GC_BASE}/requisitions/${requisitionId}/`, {
    headers: { "Accept": "application/json", "Authorization": `Bearer ${token}` },
  });
  if (!resp.ok) throw new Error(`Get requisition error: ${await resp.text()}`);
  return resp.json() as Promise<{ id: string; status: string; accounts: string[] }>;
}

export async function getTransactions(
  token: string,
  accountId: string,
  dateFrom?: string,
) {
  const url = new URL(`${GC_BASE}/accounts/${accountId}/transactions/`);
  if (dateFrom) url.searchParams.set("date_from", dateFrom);
  const resp = await fetch(url.toString(), {
    headers: { "Accept": "application/json", "Authorization": `Bearer ${token}` },
  });
  if (!resp.ok) throw new Error(`Get transactions error: ${await resp.text()}`);
  const data = await resp.json() as { transactions: { booked: unknown[]; pending: unknown[] } };
  return data.transactions.booked ?? [];
}

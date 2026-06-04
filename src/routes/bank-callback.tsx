import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/bank-callback")({
  component: BankCallbackPage,
});

function BankCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (!ref) {
      setStatus("error");
      setMessage("No requisition reference found in URL");
      return;
    }

    supabase.functions
      .invoke("bank-callback", { body: { requisition_id: ref } })
      .then(({ data, error }) => {
        if (error || data?.error) {
          setStatus("error");
          setMessage(error?.message ?? data?.error ?? "Unknown error");
        } else {
          setStatus("ok");
          setMessage(`${data.accounts} cuenta(s) conectada(s), ${data.inserted} transacciones importadas.`);
          setTimeout(() => navigate({ to: "/settings" }), 2000);
        }
      });
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      {status === "loading" && (
        <p className="text-[13px] text-muted-foreground">Conectando banco…</p>
      )}
      {status === "ok" && (
        <div className="text-center">
          <p className="text-[15px] font-medium text-foreground">Banco conectado</p>
          <p className="mt-1 text-[13px] text-muted-foreground">{message}</p>
          <p className="mt-3 text-[12px] text-muted-foreground">Redirigiendo a Configuración…</p>
        </div>
      )}
      {status === "error" && (
        <div className="text-center">
          <p className="text-[15px] font-medium text-destructive">Error al conectar</p>
          <p className="mt-1 text-[13px] text-muted-foreground">{message}</p>
          <button
            type="button"
            onClick={() => navigate({ to: "/settings" })}
            className="mt-4 rounded-md border border-border px-4 py-2 text-[13px]"
          >
            Volver a Configuración
          </button>
        </div>
      )}
    </div>
  );
}

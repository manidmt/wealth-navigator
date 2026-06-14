import { useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { SectionCard } from "@/components/app/SectionCard";
import { useAuth } from "@/hooks/use-auth";
import { openAgentStream } from "@/lib/agent-ws";
import { buildBudgetSuggestionPrompt } from "@/lib/budget-suggestion";
import type { BudgetMap, IncomeItem } from "@/lib/budget-calc";

export function AgentSuggestionPanel({
  month,
  incomes,
  savingsGoal,
  budgets,
  actuals,
}: {
  month: string;
  incomes: IncomeItem[];
  savingsGoal: number;
  budgets: BudgetMap;
  actuals: BudgetMap;
}) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "streaming" | "error">("idle");
  const [error, setError] = useState("");
  const closeRef = useRef<(() => void) | null>(null);

  function ask() {
    if (!user?.id) return;
    setText("");
    setError("");
    setStatus("streaming");
    const prompt = buildBudgetSuggestionPrompt({ month, incomes, savingsGoal, budgets, actuals });
    closeRef.current = openAgentStream(user.id, prompt, [], {
      onToken: (t) => setText((prev) => prev + t),
      onDone: () => setStatus("idle"),
      onError: (e) => {
        setError(e);
        setStatus("error");
      },
    });
  }

  return (
    <SectionCard
      title="Sugerencias del agente"
      description="Pide al Wealth Agent cómo cuadrar gastos y ahorro este mes."
    >
      <button
        type="button"
        onClick={ask}
        disabled={status === "streaming"}
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-[12.5px] font-medium text-foreground/80 transition hover:border-border-strong hover:text-foreground disabled:opacity-50"
      >
        <Sparkles className="h-3.5 w-3.5" />
        {status === "streaming" ? "Pensando…" : "Pedir sugerencias al agente"}
      </button>

      {status === "error" && <p className="mt-3 text-[12.5px] text-muted-foreground">{error}</p>}
      {text && (
        <div className="mt-3 whitespace-pre-wrap rounded-md bg-muted/40 px-3 py-2.5 text-[12.5px] leading-relaxed">
          {text}
        </div>
      )}
    </SectionCard>
  );
}

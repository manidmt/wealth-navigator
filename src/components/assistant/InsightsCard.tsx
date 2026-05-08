import { ArrowUpRight } from "lucide-react";
import { useAssistant } from "./AssistantProvider";
import { useNavigate } from "@tanstack/react-router";
import { AssistantMark } from "./AssistantMark";
import { computeInsights, type Insight } from "@/lib/assistant-mock";

const TONE_DOT: Record<Insight["tone"], string> = {
  positive: "bg-positive",
  warning: "bg-warning",
  neutral: "bg-muted-foreground/60",
};

export function InsightsCard() {
  const insights = computeInsights();
  const assistant = useAssistant();
  const navigate = useNavigate();

  return (
    <section className="rounded-xl border border-border bg-card">
      <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <AssistantMark className="h-4 w-4 text-primary" />
          <div>
            <div className="text-[13px] font-semibold tracking-tight">
              Studio Insights
            </div>
            <div className="text-[11px] text-muted-foreground">
              Observaciones generadas a partir de tus datos
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={assistant.open}
          className="hidden rounded-md border border-border px-2.5 py-1.5 text-[11.5px] font-medium text-muted-foreground hover:border-border-strong hover:text-foreground sm:inline-flex"
        >
          Preguntar al asistente
          <kbd className="ml-2 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
            ⌘K
          </kbd>
        </button>
      </header>

      <ul className="divide-y divide-border">
        {insights.map((it) => (
          <li
            key={it.id}
            className="group flex items-start gap-3 px-5 py-3.5 hover:bg-muted/30"
          >
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${TONE_DOT[it.tone]}`} />
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-medium text-foreground">
                {it.title}
              </div>
              <div className="text-[12px] text-muted-foreground">{it.body}</div>
            </div>
            <button
              type="button"
              onClick={() => navigate({ to: "/assistant", search: { q: it.prompt } })}
              className="shrink-0 self-center inline-flex items-center gap-1 rounded-md border border-transparent px-2 py-1 text-[11.5px] text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:border-border hover:text-foreground"
            >
              Profundizar <ArrowUpRight className="h-3 w-3" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

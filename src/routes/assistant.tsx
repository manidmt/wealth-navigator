import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { ArrowUp, Plus, Square } from "lucide-react";
import { z } from "zod";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/SectionCard";
import { AssistantMark } from "@/components/assistant/AssistantMark";
import {
  PLAYBOOKS,
  SUGGESTIONS,
  mockAnswer,
  type Playbook,
} from "@/lib/assistant-mock";

const searchSchema = z.object({
  q: z.string().optional(),
});

export const Route = createFileRoute("/assistant")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Studio Assistant — Wealth Studio" },
      {
        name: "description",
        content:
          "Conversa con el agente del Wealth Studio: revisión mensual, rebalance, stress test y consultas libres.",
      },
    ],
  }),
  component: AssistantPage,
});

type Msg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
};

function AssistantPage() {
  const navigate = useNavigate();
  const { q } = Route.useSearch();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-focus
  useEffect(() => {
    inputRef.current?.focus();
  }, [messages.length]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Pre-cargar pregunta desde ?q=
  useEffect(() => {
    if (q && messages.length === 0) {
      void send(q);
      // limpia el query string
      navigate({ to: "/assistant", search: {}, replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", content: trimmed };
    const pendingId = crypto.randomUUID();
    setMessages((m) => [...m, userMsg, { id: pendingId, role: "assistant", content: "", pending: true }]);
    setInput("");
    setBusy(true);
    try {
      const reply = await mockAnswer(trimmed);
      setMessages((m) =>
        m.map((msg) => (msg.id === pendingId ? { ...msg, content: reply, pending: false } : msg)),
      );
    } finally {
      setBusy(false);
    }
  }

  function runPlaybook(p: Playbook) {
    const prompt = `Ejecuta el playbook "${p.title}":\n${p.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}`;
    void send(prompt);
  }

  function reset() {
    setMessages([]);
    setInput("");
    inputRef.current?.focus();
  }

  return (
    <AppShell pageEyebrow="Studio Assistant">
      <PageHeader
        eyebrow="Beta"
        title="Studio Assistant"
        description="Tu copiloto sobre el Wealth Studio. Pregunta por gastos, allocation, evolución o ejecuta un playbook."
        actions={
          messages.length > 0 ? (
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-[12.5px] font-medium hover:border-border-strong"
            >
              <Plus className="h-3.5 w-3.5" />
              Nueva conversación
            </button>
          ) : null
        }
      />

      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 md:px-8 lg:grid-cols-[1fr_280px]">
        {/* Conversation column */}
        <div className="flex min-h-[60vh] flex-col rounded-xl border border-border bg-card">
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-6">
            {messages.length === 0 ? (
              <EmptyState onPick={(p) => void send(p)} />
            ) : (
              <ul className="space-y-6">
                {messages.map((m) => (
                  <li key={m.id}>
                    {m.role === "user" ? (
                      <div className="flex justify-end">
                        <div className="max-w-[80%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-[13.5px] leading-relaxed text-primary-foreground">
                          {m.content}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-background text-primary">
                          <AssistantMark className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1 space-y-1.5 text-[13.5px] leading-relaxed text-foreground">
                          {m.pending ? <ThinkingDots /> : <Markdownish text={m.content} />}
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Composer
            value={input}
            onChange={setInput}
            onSubmit={() => void send(input)}
            busy={busy}
            inputRef={inputRef}
          />
        </div>

        {/* Playbooks column */}
        <aside className="space-y-3">
          <div className="text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">
            Playbooks
          </div>
          {PLAYBOOKS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => runPlaybook(p)}
              className="block w-full rounded-lg border border-border bg-card p-4 text-left transition hover:border-border-strong"
            >
              <div className="text-[13px] font-semibold tracking-tight">{p.title}</div>
              <div className="mt-1 text-[12px] leading-snug text-muted-foreground">
                {p.description}
              </div>
              <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-primary">
                Ejecutar →
              </div>
            </button>
          ))}

          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-3 text-[11px] leading-relaxed text-muted-foreground">
            Modo demo: las respuestas son simuladas. Conecta el backend con
            Lovable AI Gateway para activar el agente real.
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

/* --------------------------------- bits --------------------------------- */

function EmptyState({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 py-10 text-center">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-border bg-background text-primary">
        <AssistantMark className="h-7 w-7" />
      </span>
      <div>
        <h2 className="font-display text-xl font-semibold tracking-tight">
          ¿Qué quieres explorar hoy?
        </h2>
        <p className="mt-1 text-[12.5px] text-muted-foreground">
          Pregunta libremente o arranca con una sugerencia.
        </p>
      </div>
      <div className="grid w-full max-w-xl gap-2 sm:grid-cols-2">
        {SUGGESTIONS.slice(0, 4).map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onPick(s.prompt)}
            className="rounded-lg border border-border bg-background px-3.5 py-3 text-left text-[12.5px] transition hover:border-border-strong"
          >
            <div className="font-medium text-foreground">{s.label}</div>
            <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
              {s.prompt}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ThinkingDots() {
  return (
    <div className="inline-flex items-center gap-1 text-muted-foreground">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current [animation-delay:120ms]" />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current [animation-delay:240ms]" />
    </div>
  );
}

/** Renderizado mínimo de markdown: párrafos, listas, **bold**, _italic_. */
function Markdownish({ text }: { text: string }) {
  const blocks = text.split(/\n\n+/);
  return (
    <>
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        const isList = lines.every((l) => /^\s*[-*\d]/.test(l) || l.trim() === "");
        if (isList) {
          return (
            <ul key={i} className="list-disc space-y-0.5 pl-5 text-[13px]">
              {lines
                .filter((l) => l.trim())
                .map((l, j) => (
                  <li key={j}>{inline(l.replace(/^\s*[-*]\s?|^\s*\d+\.\s?/, ""))}</li>
                ))}
            </ul>
          );
        }
        return (
          <p key={i} className="text-[13.5px]">
            {inline(block)}
          </p>
        );
      })}
    </>
  );
}

function inline(s: string) {
  // bold + italic
  const parts: ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|_[^_]+_)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = regex.exec(s))) {
    if (m.index > last) parts.push(s.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) {
      parts.push(<strong key={key++}>{tok.slice(2, -2)}</strong>);
    } else {
      parts.push(<em key={key++}>{tok.slice(1, -1)}</em>);
    }
    last = m.index + tok.length;
  }
  if (last < s.length) parts.push(s.slice(last));
  return parts;
}

function Composer({
  value,
  onChange,
  onSubmit,
  busy,
  inputRef,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  busy: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement>;
}) {
  return (
    <div className="border-t border-border bg-muted/20 p-3">
      <div className="flex items-end gap-2 rounded-xl border border-border bg-background px-3 py-2 focus-within:border-border-strong">
        <textarea
          ref={inputRef}
          rows={1}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            const el = e.currentTarget;
            el.style.height = "auto";
            el.style.height = Math.min(el.scrollHeight, 180) + "px";
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSubmit();
            }
          }}
          placeholder="Escribe tu pregunta…  (Enter para enviar, Shift+Enter salto de línea)"
          className="max-h-[180px] flex-1 resize-none bg-transparent py-1.5 text-[13.5px] outline-none placeholder:text-muted-foreground"
        />
        <button
          type="button"
          onClick={onSubmit}
          disabled={!value.trim() || busy}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={busy ? "Procesando" : "Enviar"}
        >
          {busy ? <Square className="h-3.5 w-3.5" /> : <ArrowUp className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

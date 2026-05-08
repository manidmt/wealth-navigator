import { useNavigate } from "@tanstack/react-router";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { PlatformBadge } from "./PlatformBadge";
import { AssistantMark } from "@/components/assistant/AssistantMark";
import { euro1, type Holding } from "@/lib/dashboard-data";

type Props = {
  holding: Holding | null;
  /** Total portfolio used to compute weight. */
  total: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function HoldingDrawer({ holding, total, open, onOpenChange }: Props) {
  const navigate = useNavigate();
  if (!holding) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-md" />
      </Sheet>
    );
  }

  const weight = total > 0 ? (holding.value / total) * 100 : 0;
  const isLiability = holding.value < 0;
  const askPrompt = `Cuéntame más sobre mi posición "${holding.label}" en ${holding.platform}: peso, riesgo y posibles ajustes.`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader className="gap-1">
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            {holding.category ?? "Posición"}
          </div>
          <SheetTitle className="font-display text-2xl tracking-tight">
            {holding.label}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Detalle de la posición {holding.label}
          </SheetDescription>
          <div className="pt-2">
            <PlatformBadge name={holding.platform} />
          </div>
        </SheetHeader>

        <div className="mt-6 grid gap-3 px-4 sm:grid-cols-2">
          <Stat label="Valor" value={euro1.format(holding.value)} accent={isLiability ? "negative" : undefined} />
          <Stat label="Peso del portfolio" value={`${weight.toFixed(2)}%`} />
          <Stat label="Tipo" value={holding.category ?? "—"} />
          <Stat label="Plataforma" value={holding.platform} />
        </div>

        <div className="mt-6 px-4">
          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-3 text-[12px] leading-relaxed text-muted-foreground">
            Las series históricas por posición llegarán cuando conectes el
            backend. De momento puedes preguntar al asistente para un análisis
            cualitativo.
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-border px-4 pt-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-[12.5px] text-muted-foreground hover:text-foreground"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={() => {
              onOpenChange(false);
              navigate({ to: "/assistant", search: { q: askPrompt } });
            }}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-[12.5px] font-medium text-primary-foreground transition hover:opacity-90"
          >
            <AssistantMark className="h-3.5 w-3.5" />
            Preguntar al asistente
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "negative";
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      <div
        className={
          "mt-1 font-display text-base font-semibold tabular-nums " +
          (accent === "negative" ? "text-negative" : "text-foreground")
        }
      >
        {value}
      </div>
    </div>
  );
}

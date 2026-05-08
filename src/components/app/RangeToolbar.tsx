import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type RangeKey = "3M" | "6M" | "12M" | "YTD" | "ALL";

const OPTIONS: { key: RangeKey; label: string; months: number | "ytd" | "all" }[] = [
  { key: "3M", label: "3M", months: 3 },
  { key: "6M", label: "6M", months: 6 },
  { key: "12M", label: "12M", months: 12 },
  { key: "YTD", label: "YTD", months: "ytd" },
  { key: "ALL", label: "Todo", months: "all" },
];

type Ctx = {
  range: RangeKey;
  setRange: (r: RangeKey) => void;
  /** Trim a series with `month: "YYYY-MM"` field according to the active range. */
  slice<T extends { month: string }>(rows: T[]): T[];
};

const RangeContext = createContext<Ctx | null>(null);

export function RangeProvider({
  children,
  defaultRange = "12M",
}: {
  children: ReactNode;
  defaultRange?: RangeKey;
}) {
  const [range, setRange] = useState<RangeKey>(defaultRange);

  const value = useMemo<Ctx>(() => {
    const opt = OPTIONS.find((o) => o.key === range)!;
    return {
      range,
      setRange,
      slice<T extends { month: string }>(rows: T[]) {
        if (!rows.length) return rows;
        if (opt.months === "all") return rows;
        if (opt.months === "ytd") {
          const lastYear = rows[rows.length - 1].month.slice(0, 4);
          return rows.filter((r) => r.month.startsWith(lastYear));
        }
        return rows.slice(-opt.months);
      },
    };
  }, [range]);

  return <RangeContext.Provider value={value}>{children}</RangeContext.Provider>;
}

export function useRange() {
  const ctx = useContext(RangeContext);
  if (!ctx) throw new Error("useRange must be used inside <RangeProvider>");
  return ctx;
}

type ToolbarProps = {
  /** Optional left-aligned context label (e.g. "Resumen · 12 cierres"). */
  label?: ReactNode;
  /** Optional extra controls on the right. */
  actions?: ReactNode;
  className?: string;
};

export function RangeToolbar({ label, actions, className }: ToolbarProps) {
  const { range, setRange } = useRange();
  return (
    <div
      className={cn(
        "sticky top-14 z-20 -mx-4 mb-2 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background/85 px-4 py-2.5 backdrop-blur md:-mx-8 md:px-8",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3 text-[12px] text-muted-foreground">
        <span className="text-[10.5px] uppercase tracking-[0.16em]">Rango</span>
        <div
          role="tablist"
          aria-label="Rango temporal"
          className="inline-flex rounded-md border border-border bg-card p-0.5 text-[12px]"
        >
          {OPTIONS.map((o) => {
            const active = o.key === range;
            return (
              <button
                key={o.key}
                role="tab"
                aria-selected={active}
                type="button"
                onClick={() => setRange(o.key)}
                className={cn(
                  "rounded px-2.5 py-1 font-medium tabular-nums transition",
                  active
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {o.label}
              </button>
            );
          })}
        </div>
        {label ? <span className="hidden truncate sm:inline">{label}</span> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

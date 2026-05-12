import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  useCreateMovement,
  type MovementType,
} from "@/lib/movements-api";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMonth?: string;
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function AddMovementSheet({ open, onOpenChange, defaultMonth }: Props) {
  const defaultDate = defaultMonth
    ? `${defaultMonth}-01`
    : todayStr();

  const [type, setType] = useState<MovementType>("expense");
  const [date, setDate] = useState(defaultMonth ? `${defaultMonth}-${todayStr().slice(8)}` : todayStr());
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  const createMovement = useCreateMovement();

  const categories = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  function reset() {
    setType("expense");
    setDate(defaultMonth ? `${defaultMonth}-${todayStr().slice(8)}` : todayStr());
    setCategory("");
    setDescription("");
    setAmount("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(amount.replace(",", "."));
    if (!date || !category || isNaN(parsed) || parsed <= 0) return;

    await createMovement.mutateAsync({
      type,
      date,
      category,
      description: description.trim() || undefined,
      amount: parsed,
      currency: "EUR",
    });

    reset();
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader className="gap-1">
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Nuevo movimiento
          </div>
          <SheetTitle className="font-display text-2xl tracking-tight">
            Añadir {type === "expense" ? "gasto" : "ingreso"}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Formulario para añadir un gasto o ingreso
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5 px-1">
          {/* Type toggle */}
          <div className="flex rounded-lg border border-border bg-muted/30 p-0.5">
            {(["expense", "income"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setType(t); setCategory(""); }}
                className={`flex-1 rounded-md py-1.5 text-[13px] font-medium transition ${
                  type === t
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "expense" ? "Gasto" : "Ingreso"}
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mov-date" className="text-[12px]">Fecha</Label>
            <Input
              id="mov-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="text-[13px]"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mov-cat" className="text-[12px]">Categoría</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger id="mov-cat" className="text-[13px]">
                <SelectValue placeholder="Selecciona una categoría…" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c} className="text-[13px]">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mov-desc" className="text-[12px]">
              Descripción <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="mov-desc"
              type="text"
              placeholder="Ej. Café Starbucks"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-[13px]"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mov-amount" className="text-[12px]">Importe (EUR)</Label>
            <div className="relative">
              <Input
                id="mov-amount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="pr-10 text-[13px] tabular-nums"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-muted-foreground">
                €
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => { reset(); onOpenChange(false); }}
              className="text-[13px] text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </button>
            <Button
              type="submit"
              disabled={createMovement.isPending || !category || !amount}
              className="min-w-[100px]"
            >
              {createMovement.isPending ? "Guardando…" : "Guardar"}
            </Button>
          </div>

          {createMovement.isError && (
            <p className="text-[12px] text-destructive">
              Error al guardar. Inténtalo de nuevo.
            </p>
          )}
        </form>
      </SheetContent>
    </Sheet>
  );
}

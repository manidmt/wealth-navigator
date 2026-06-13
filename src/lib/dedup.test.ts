import { describe, it, expect } from "vitest";
import { findDuplicate, type DedupRow } from "./dedup";

const manuals: DedupRow[] = [
  { id: "m1", amount: 15, type: "expense", date: "2026-06-10" },
  { id: "m2", amount: 50, type: "expense", date: "2026-06-01" },
];

describe("findDuplicate", () => {
  it("mismo importe+tipo, fecha exacta → match", () =>
    expect(findDuplicate({ amount: 15, type: "expense", date: "2026-06-10" }, manuals)).toBe("m1"));
  it("dentro de ±3 días → match", () =>
    expect(findDuplicate({ amount: 15, type: "expense", date: "2026-06-12" }, manuals)).toBe("m1"));
  it("fuera de ±3 días → null", () =>
    expect(findDuplicate({ amount: 15, type: "expense", date: "2026-06-20" }, manuals)).toBeNull());
  it("importe distinto → null", () =>
    expect(findDuplicate({ amount: 14, type: "expense", date: "2026-06-10" }, manuals)).toBeNull());
  it("tipo distinto → null", () =>
    expect(findDuplicate({ amount: 15, type: "income", date: "2026-06-10" }, manuals)).toBeNull());
  it("sin manuales → null", () =>
    expect(findDuplicate({ amount: 15, type: "expense", date: "2026-06-10" }, [])).toBeNull());
});

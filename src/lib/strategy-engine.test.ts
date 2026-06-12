import { describe, it, expect } from "vitest";
import { evaluateBase, type LadderRule, type SignalMap } from "./strategy-engine";

const sig = (value: number): SignalMap => ({
  msci_dd: { value, date: "2026-06-01", source: "auto" },
});

const rvLadder: LadderRule = {
  type: "ladder",
  cadence: "annual",
  signal: "msci_dd",
  steps: [
    { lte: -0.1, multi: 2 },
    { lte: -0.2, multi: 3 },
  ],
  default: 1,
};

describe("ladder rule", () => {
  it("no drawdown → default", () => expect(evaluateBase(rvLadder, sig(-0.05)).multi).toBe(1));
  it("boundary -10% → x2", () => expect(evaluateBase(rvLadder, sig(-0.1)).multi).toBe(2));
  it("-15% → x2", () => expect(evaluateBase(rvLadder, sig(-0.15)).multi).toBe(2));
  it("boundary -20% → x3", () => expect(evaluateBase(rvLadder, sig(-0.2)).multi).toBe(3));
  it("-35% → x3 (deepest)", () => expect(evaluateBase(rvLadder, sig(-0.35)).multi).toBe(3));
  it("señal ausente → default", () => expect(evaluateBase(rvLadder, {}).multi).toBe(1));
});

import { describe, it, expect } from "vitest";
import { fireNumber, fireProgress, monthsToFire, estimatedFireDate } from "./fire";

describe("fire", () => {
  it("fireNumber = gasto / (swr/100)", () => {
    expect(fireNumber(24000, 4)).toBe(600000);
    expect(fireNumber(24000, 0)).toBe(0);
  });
  it("fireProgress clampa 0..1", () => {
    expect(fireProgress(108000, 600000)).toBeCloseTo(0.18, 5);
    expect(fireProgress(900000, 600000)).toBe(1);
    expect(fireProgress(100, 0)).toBe(0);
  });
  it("monthsToFire: ya alcanzado => 0", () => {
    expect(monthsToFire(600000, 600000, 0, 0)).toBe(0);
  });
  it("monthsToFire: con ahorro sin retorno", () => {
    expect(monthsToFire(0, 1200, 100, 0)).toBe(12);
  });
  it("monthsToFire: inalcanzable => null", () => {
    expect(monthsToFire(0, 100000, 0, 0)).toBeNull();
  });
  it("estimatedFireDate suma meses", () => {
    expect(estimatedFireDate(new Date(2026, 5, 15), 12)).toBe("2027-06");
  });
});

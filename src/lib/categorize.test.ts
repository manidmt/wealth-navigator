import { describe, it, expect } from "vitest";
import { categorize } from "./categorize";

describe("categorize (expense)", () => {
  it("MERCADONA → Comida", () =>
    expect(categorize("COMPRA MERCADONA MADRID", "expense")).toBe("Comida"));
  it("NETFLIX → Suscripciones", () =>
    expect(categorize("NETFLIX.COM", "expense")).toBe("Suscripciones"));
  it("AMAZON PRIME → Suscripciones (gana a AMAZON)", () =>
    expect(categorize("AMAZON PRIME*123", "expense")).toBe("Suscripciones"));
  it("AMAZON (sin prime) → Tecnología", () =>
    expect(categorize("AMAZON MKTPLACE", "expense")).toBe("Tecnología"));
  it("IBERDROLA → Hogar", () => expect(categorize("RECIBO IBERDROLA", "expense")).toBe("Hogar"));
  it("REPSOL → Coche", () => expect(categorize("E.S. REPSOL", "expense")).toBe("Coche"));
  it("desconocido → Sin categoría", () =>
    expect(categorize("PAGO XYZ 9999", "expense")).toBe("Sin categoría"));
});

describe("categorize (income)", () => {
  it("NOMINA → Nómina", () =>
    expect(categorize("ABONO NOMINA EMPRESA SL", "income")).toBe("Nómina"));
  it("ingreso desconocido → Sin categoría", () =>
    expect(categorize("TRANSFERENCIA", "income")).toBe("Sin categoría"));
});

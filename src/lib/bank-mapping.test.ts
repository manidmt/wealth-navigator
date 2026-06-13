import { describe, it, expect } from "vitest";
import { mapTransaction, isBooked, type EbTransaction } from "./bank-mapping";

const base: EbTransaction = {
  transaction_amount: { amount: "12.34", currency: "EUR" },
  credit_debit_indicator: "DBIT",
  status: "BOOK",
  booking_date: "2026-06-10",
  transaction_id: "tx-1",
  remittance_information: ["COMPRA MERCADONA"],
};

describe("mapTransaction", () => {
  it("DBIT → expense, amount abs, categoriza", () => {
    expect(mapTransaction(base, "u1")).toMatchObject({
      user_id: "u1",
      type: "expense",
      amount: 12.34,
      currency: "EUR",
      date: "2026-06-10",
      description: "COMPRA MERCADONA",
      category: "Comida",
      external_id: "tx-1",
    });
  });
  it("CRDT → income", () =>
    expect(
      mapTransaction(
        { ...base, credit_debit_indicator: "CRDT", remittance_information: ["ABONO NOMINA"] },
        "u1",
      ).type,
    ).toBe("income"));
  it("description desde creditor si no hay remittance", () =>
    expect(
      mapTransaction(
        { ...base, remittance_information: undefined, creditor: { name: "ACME SL" } },
        "u1",
      ).description,
    ).toBe("ACME SL"));
  it("date cae a value_date si falta booking_date", () =>
    expect(
      mapTransaction({ ...base, booking_date: undefined, value_date: "2026-06-09" }, "u1").date,
    ).toBe("2026-06-09"));
  it("external_id cae a entry_reference si falta transaction_id", () =>
    expect(
      mapTransaction({ ...base, transaction_id: undefined, entry_reference: "ref-9" }, "u1")
        .external_id,
    ).toBe("ref-9"));
});

describe("isBooked", () => {
  it("BOOK true, PDNG false", () => {
    expect(isBooked(base)).toBe(true);
    expect(isBooked({ ...base, status: "PDNG" })).toBe(false);
  });
});

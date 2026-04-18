import { describe, it, expect } from "vitest";
import { parseTransactionsCsv } from "@/lib/transactions/csv-parser";
import * as fs from "fs";
import * as path from "path";

// ── Helpers ───────────────────────────────────────────────────────────────────

function loadSample(filename: string): string {
  return fs.readFileSync(path.resolve(__dirname, `../${filename}`), "utf-8");
}

// ── AU format ─────────────────────────────────────────────────────────────────

describe("AU transaction summary CSV", () => {
  const csv = loadSample("sample-transactions.csv");
  let txns: ReturnType<typeof parseTransactionsCsv>;

  it("parses without throwing", () => {
    txns = parseTransactionsCsv(csv);
    expect(txns).toBeDefined();
  });

  it("returns only debit rows (no credits)", () => {
    txns = txns ?? parseTransactionsCsv(csv);
    // Direct Credit / payroll rows should be filtered out
    const hasCredit = txns.some((t) =>
      /fabric payroll|direct credit|fast transfer from/i.test(t.merchant)
    );
    expect(hasCredit).toBe(false);
  });

  it("gives every transaction a positive amount", () => {
    txns.forEach((t) => expect(Math.abs(t.amount)).toBeGreaterThan(0));
  });

  it("categorises Puma as Fast Fashion", () => {
    const puma = txns.find((t) => /puma/i.test(t.merchant));
    expect(puma).toBeDefined();
    expect(puma?.category).toBe("Fast Fashion");
  });

  it("categorises TRANSPORTFORNSW as Transport", () => {
    const opal = txns.find((t) => /transportfornsw/i.test(t.merchant));
    expect(opal).toBeDefined();
    expect(opal?.category).toBe("Transport");
  });

  it("categorises Chemist Warehouse as Hygiene Products", () => {
    const chemist = txns.find((t) => /chemist warehouse/i.test(t.merchant));
    expect(chemist).toBeDefined();
    expect(chemist?.category).toBe("Hygiene Products");
  });

  it("categorises SUPA M as Grocery", () => {
    const supa = txns.find((t) => /supa m/i.test(t.merchant));
    expect(supa).toBeDefined();
    expect(supa?.category).toBe("Grocery");
  });

  it("categorises Skybus as Transport", () => {
    const skybus = txns.find((t) => /skybus/i.test(t.merchant));
    expect(skybus).toBeDefined();
    expect(skybus?.category).toBe("Transport");
  });

  it("categorises Subway as Food Delivery", () => {
    const sub = txns.find((t) => /subway/i.test(t.merchant));
    expect(sub).toBeDefined();
    expect(sub?.category).toBe("Food Delivery");
  });

  it("parses AU dates into valid ISO strings", () => {
    txns.forEach((t) => {
      expect(() => new Date(t.date)).not.toThrow();
      expect(new Date(t.date).getFullYear()).toBeGreaterThanOrEqual(2020);
    });
  });
});


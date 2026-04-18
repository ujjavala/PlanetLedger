import Papa from "papaparse";
import { resolveCategory, resolveImpactColor } from "@/lib/transactions/categorization";
import type { Transaction } from "@/lib/types";

type CsvTransactionRow = {
  Date?: string;
  Transaction?: string;
  Debit?: string;
  Credit?: string;
  Balance?: string;
  merchant?: string;
  amount?: string | number;
  category?: string;
  date?: string;
};

function parseDateOrNow(dateValue: string | undefined): string {
  if (!dateValue) return new Date().toISOString();
  const d = Date.parse(dateValue);
  if (!isNaN(d)) return new Date(d).toISOString();
  return new Date().toISOString();
}

function parseAmount(debit?: string, credit?: string): number {
  const clean = (v: string) => Number(v.replaceAll(/[^\d.]/g, ""));
  if (debit && debit.trim() !== "") {
    const n = clean(debit);
    return Number.isNaN(n) || n === 0 ? 0 : -n;
  }
  if (credit && credit.trim() !== "") {
    const n = clean(credit);
    return Number.isNaN(n) ? 0 : n;
  }
  return 0;
}

export function parseTransactionsCsv(csvText: string): Transaction[] {
  const parsedResult = Papa.parse<CsvTransactionRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  return parsedResult.data
    .filter((row) => {
      // Only process debit transactions (money spent). Skip credits (income/refunds).
      const hasDebit = row.Debit && row.Debit.trim() !== "";
      const hasLegacyAmount = row.amount !== undefined && row.amount !== "";
      return Boolean(hasDebit) || (!row.Debit && !row.Credit && hasLegacyAmount);
    })
    .map((row, index) => {
      const merchant = (row.Transaction ?? row.merchant ?? "Unknown Merchant").trim();
      const amount = parseAmount(row.Debit, row.Credit);
      const date = parseDateOrNow(row.Date ?? row.date);
      const category = resolveCategory("", merchant, Math.abs(amount));
      return {
        id: `${merchant}-${index}-${Math.floor(Math.random() * 10000)}`,
        merchant,
        amount,
        category,
        date,
        impact: resolveImpactColor(category, Math.abs(amount)),
      };
    });
}

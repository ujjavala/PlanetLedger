import type { Transaction } from "@/lib/types";

type MerchantFrequency = {
  merchant: string;
  count: number;
};

function isWithinLastDays(dateIso: string, days: number): boolean {
  const now = Date.now();
  const timestamp = new Date(dateIso).getTime();
  const deltaMs = now - timestamp;
  const dayMs = 24 * 60 * 60 * 1000;
  return deltaMs <= days * dayMs;
}

function frequencyByMerchant(transactions: Transaction[]): MerchantFrequency[] {
  const frequencies = transactions.reduce<Record<string, number>>((accumulator, transaction) => {
    accumulator[transaction.merchant] = (accumulator[transaction.merchant] ?? 0) + 1;
    return accumulator;
  }, {});

  return Object.entries(frequencies)
    .map(([merchant, count]) => ({ merchant, count }))
    .sort((a, b) => b.count - a.count);
}

export function retrieveRecentTransactions(transactions: Transaction[]): Transaction[] {
  const recent = transactions.filter((transaction) => isWithinLastDays(transaction.date, 7));
  return recent.length > 0 ? recent : transactions;
}

export function retrieveFrequentMerchants(transactions: Transaction[]): string[] {
  return frequencyByMerchant(transactions)
    .slice(0, 3)
    .map((item) => item.merchant);
}

export function retrieveTopCategories(transactions: Transaction[]): string[] {
  const categoryTotals = transactions.reduce<Record<string, number>>((accumulator, transaction) => {
    accumulator[transaction.category] = (accumulator[transaction.category] ?? 0) + transaction.amount;
    return accumulator;
  }, {});

  return Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([category]) => category.toLowerCase().replace(/\s+/g, "_"));
}

import type { Transaction } from "../types/agent";

export type DetectedPattern =
  | "weekendSpendingSpike"
  | "fastFashionBurst"
  | "categoryConcentration"
  | "weekdayWeekendImbalance";

export function detectPatterns(transactions: Transaction[]): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];

  // Weekend spending spike
  const weekendTx = transactions.filter((t) => {
    const day = new Date(t.date).getDay();
    return day === 0 || day === 6;
  });
  if (weekendTx.length > transactions.length * 0.5) {
    patterns.push("weekendSpendingSpike");
  }

  // Fast fashion burst (7-day window)
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const fastFashionBurst = transactions.filter(
    (t) => t.category === "FAST_FASHION" && new Date(t.date).getTime() > weekAgo
  );
  if (fastFashionBurst.length >= 2) {
    patterns.push("fastFashionBurst");
  }

  // Category concentration
  const catCounts: Record<string, number> = {};
  for (const t of transactions) {
    catCounts[t.category] = (catCounts[t.category] || 0) + 1;
  }
  if (Object.values(catCounts).some((count) => count > transactions.length * 0.7)) {
    patterns.push("categoryConcentration");
  }

  // Weekday vs weekend imbalance
  const weekdayTx = transactions.filter((t) => {
    const day = new Date(t.date).getDay();
    return day >= 1 && day <= 5;
  });
  if (
    Math.abs(weekdayTx.length - weekendTx.length) > transactions.length * 0.3
  ) {
    patterns.push("weekdayWeekendImbalance");
  }

  return patterns;
}

import type { Transaction } from "@/lib/types";

export type SimulationRequest = {
  reduceFoodDeliveryPercent: number;
};

export function applyFoodDeliveryReduction(transactions: Transaction[], percent: number): Transaction[] {
  const ratio = Math.max(0, Math.min(100, percent)) / 100;

  return transactions.map((transaction) => {
    if (transaction.category !== "Food Delivery") {
      return transaction;
    }

    const reducedAmount = Number((transaction.amount * (1 - ratio)).toFixed(2));
    const reducedImpact = reducedAmount > 20 ? "YELLOW" : "GREEN";

    return {
      ...transaction,
      amount: reducedAmount,
      impact: reducedImpact
    };
  });
}

import type { Transaction } from "@/lib/types";

function isWeekend(dateIso: string): boolean {
  const day = new Date(dateIso).getDay();
  return day === 0 || day === 6;
}

function countCategory(transactions: Transaction[], category: Transaction["category"]): number {
  return transactions.filter((transaction) => transaction.category === category).length;
}

function sumCategoryAmount(transactions: Transaction[], category: Transaction["category"]): number {
  return transactions
    .filter((transaction) => transaction.category === category)
    .reduce((total, transaction) => total + transaction.amount, 0);
}

export function detectBehaviorPatterns(transactions: Transaction[]): string[] {
  const detectedPatterns: string[] = [];

  const weekendFashionCount = transactions.filter(
    (transaction) => transaction.category === "Fast Fashion" && isWeekend(transaction.date)
  ).length;
  if (weekendFashionCount >= 2) {
    detectedPatterns.push("Fast fashion purchases frequently occur on weekends.");
  }

  const foodDeliveryCount = countCategory(transactions, "Food Delivery");
  if (foodDeliveryCount >= 3) {
    detectedPatterns.push("Food delivery appears as a repeated weekly habit.");
  }

  const transportSpend = sumCategoryAmount(transactions, "Transport");
  if (transportSpend > 120) {
    detectedPatterns.push("Transport costs are high enough to benefit from route planning.");
  }

  if (detectedPatterns.length === 0) {
    detectedPatterns.push("No major high-impact behavior patterns detected this week.");
  }

  return detectedPatterns;
}

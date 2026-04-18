import type { Transaction, TransactionCategory, ImpactTag } from "../types/agent";

export function classifyCategory(category: TransactionCategory): ImpactTag {
  switch (category) {
    case "FAST_FASHION":
      return "RED";
    case "FOOD_DELIVERY":
      return "YELLOW";
    case "GROCERY":
      return "GREEN"; // Could be YELLOW if needed
    case "HYGIENE":
      return "RED";
    case "TRANSPORT":
      return "GREEN"; // Could be YELLOW if needed
    default:
      return "YELLOW";
  }
}

export function scoreImpact(tag: ImpactTag): number {
  if (tag === "GREEN") return 10;
  if (tag === "YELLOW") return 5;
  return -2;
}

export function classifyAndScore(tx: Omit<Transaction, "impactTag" | "impactScore">): Transaction {
  const impactTag = classifyCategory(tx.category);
  const impactScore = scoreImpact(impactTag);
  return { ...tx, impactTag, impactScore };
}

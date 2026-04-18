import { detectBehaviorPatterns } from "@/lib/agent/pattern-detector";
import { retrieveFrequentMerchants, retrieveRecentTransactions, retrieveTopCategories } from "@/lib/rag/retrieval";
import type { ScorePayload, Transaction } from "@/lib/types";

export type RagContext = {
  top_categories: string[];
  weekly_spend: number;
  high_impact_count: number;
  patterns: string[];
  frequent_merchants: string[];
};

export function buildRagContext(transactions: Transaction[], score: ScorePayload): RagContext {
  const recentTransactions = retrieveRecentTransactions(transactions);
  const weeklySpend = recentTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);

  return {
    top_categories: retrieveTopCategories(recentTransactions),
    weekly_spend: Number(weeklySpend.toFixed(2)),
    high_impact_count: score.highImpactCount,
    patterns: detectBehaviorPatterns(recentTransactions),
    frequent_merchants: retrieveFrequentMerchants(recentTransactions)
  };
}

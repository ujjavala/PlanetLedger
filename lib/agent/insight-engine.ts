import { detectBehaviorPatterns } from "@/lib/agent/pattern-detector";
import type { RagContext } from "@/lib/rag/context-builder";
import type { InsightPayload, ScorePayload, Transaction, UserContext } from "@/lib/types";

function createRecommendations(transactions: Transaction[], userContext: UserContext): string[] {
  const recommendations: string[] = [];

  if (transactions.some((transaction) => transaction.category === "Fast Fashion")) {
    recommendations.push(
      "You frequently purchase fast fashion on weekends. Switch one purchase to second-hand options this week."
    );
  }

  if (transactions.filter((transaction) => transaction.category === "Food Delivery").length >= 2) {
    recommendations.push("Replace one food delivery order with meal prep to reduce cost and carbon impact.");
  }

  if (!userContext.preferences.noCarOwnership && transactions.some((transaction) => transaction.category === "Transport")) {
    recommendations.push("Bundle transport errands and try one lower-emission commute day.");
  }

  if (userContext.preferences.lowIncomeMode) {
    recommendations.push("Prioritize budget-friendly eco options like bulk grocery and refill products.");
  }

  if (recommendations.length === 0) {
    recommendations.push("Great momentum. Keep prioritizing low-impact categories.");
  }

  return recommendations;
}

function createSummary(score: ScorePayload, ragContext: RagContext): string {
  const topCategory = ragContext.top_categories[0] ?? "mixed categories";
  if (score.impactScore >= 70) {
    return `Strong sustainability performance this week. Top spend category is ${topCategory} with controlled high-impact activity.`;
  }

  return `Your score can improve by reducing ${topCategory} spend. Weekly spend is $${ragContext.weekly_spend}.`;
}

export function buildAgentInsights(
  transactions: Transaction[],
  userContext: UserContext,
  score: ScorePayload,
  ragContext: RagContext
): InsightPayload {
  return {
    summary: createSummary(score, ragContext),
    recommendations: createRecommendations(transactions, userContext),
    behaviorPatterns: detectBehaviorPatterns(transactions)
  };
}

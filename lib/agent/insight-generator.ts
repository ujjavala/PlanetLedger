import type { Transaction, AgentInsightsResponse } from "../types/agent";
import { detectPatterns } from "./pattern-engine";

export function generateAgentInsights(transactions: Transaction[]): AgentInsightsResponse {
  // Score breakdown
  let score = 0;
  let green = 0, yellow = 0, red = 0;
  for (const tx of transactions) {
    score += tx.impactScore;
    if (tx.impactTag === "GREEN") green++;
    else if (tx.impactTag === "YELLOW") yellow++;
    else if (tx.impactTag === "RED") red++;
  }

  // Pattern detection
  const patterns = detectPatterns(transactions);

  // Summary
  const summary = `Your sustainability score is ${score}. Green: ${green}, Yellow: ${yellow}, Red: ${red}.`;

  // Insights
  const insights = patterns.map((p) => {
    if (p === "weekendSpendingSpike") return { type: "WARNING" as const, message: "High weekend spending detected." };
    if (p === "fastFashionBurst") return { type: "WARNING" as const, message: "Fast fashion burst detected in the last 7 days." };
    if (p === "categoryConcentration") return { type: "NEUTRAL" as const, message: "Spending is concentrated in one category." };
    if (p === "weekdayWeekendImbalance") return { type: "NEUTRAL" as const, message: "Weekday vs weekend spending is imbalanced." };
    return { type: "NEUTRAL" as const, message: p };
  });

  // Recommendations
  const recommendations: string[] = [];
  if (red > 0) recommendations.push("Reduce high-impact (red) category spending.");
  if (patterns.includes("weekendSpendingSpike")) recommendations.push("Try to balance spending across the week.");
  if (patterns.includes("fastFashionBurst")) recommendations.push("Avoid fast fashion purchases in short bursts.");
  if (green > yellow + red) recommendations.push("Great job prioritizing green categories!");

  return {
    summary,
    score,
    breakdown: { green, yellow, red },
    insights,
    recommendations
  };
}

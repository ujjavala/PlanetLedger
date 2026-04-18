import type { Transaction, AgentInsightsResponse } from "../types/agent";
import { classifyAndScore } from "./rule-engine";
import { generateAgentInsights } from "./insight-generator";

export function agentPipeline(transactions: Omit<Transaction, "impactTag" | "impactScore">[]): AgentInsightsResponse {
  // Deterministic pipeline: classify, score, detect patterns, generate insights
  const classified = transactions.map(classifyAndScore);
  return generateAgentInsights(classified);
}

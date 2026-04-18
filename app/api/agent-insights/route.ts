import { NextResponse } from "next/server";

import { authorizeAgentScope } from "@/lib/auth/agent-authorization";
import { getTransactions } from "@/lib/store";
import { getAgentMemory, updateAgentMemory } from "@/lib/agent/memory";
import { agentPipeline } from "@/lib/agent/pipeline";

export async function GET() {
  const authorization = await authorizeAgentScope("write:insights");
  if (!authorization.ok) {
    return authorization.response;
  }

  // Use the authenticated user's real ID from the session
  const userId = authorization.context.userId;
  const transactions = getTransactions(userId);

  if (transactions.length === 0) {
    return NextResponse.json({
      summary: "Upload transactions to activate personalized sustainability guidance.",
      score: 0,
      breakdown: { green: 0, yellow: 0, red: 0 },
      insights: [],
      recommendations: [],
      memory: getAgentMemory(userId)
    });
  }



  // Map legacy Transaction type to agent Transaction type for pipeline input
  const categoryMap: Record<string, import("@/lib/types/agent").TransactionCategory> = {
    "Fast Fashion": "FAST_FASHION",
    "Food Delivery": "FOOD_DELIVERY",
    "Grocery": "GROCERY",
    "Hygiene Products": "HYGIENE",
    "Transport": "TRANSPORT"
  };
  const pipelineInput = transactions.map((tx) => ({
    id: tx.id,
    user_id: userId,
    merchant: tx.merchant,
    amount: tx.amount,
    category: categoryMap[tx.category] ?? "GROCERY", // fallback
    date: tx.date
  }));
  const result = agentPipeline(pipelineInput);

  // Update agent memory
  updateAgentMemory(userId, {
    lastInsights: result.insights.map(i => i.message),
    learnedPatterns: result.insights.map(i => i.type)
  });

  return NextResponse.json({
    ...result,
    memory: getAgentMemory(userId)
  });
}

import { buildAgentPromptTemplate } from "@/lib/rag/prompt-template";
import type { RagContext } from "@/lib/rag/context-builder";
import type { InsightPayload, ScorePayload, Transaction, UserContext } from "@/lib/types";

function categoryFrequency(transactions: Transaction[]): Record<string, number> {
  return transactions.reduce<Record<string, number>>((accumulator, transaction) => {
    accumulator[transaction.category] = (accumulator[transaction.category] ?? 0) + 1;
    return accumulator;
  }, {});
}

function resolveTopHabit(transactions: Transaction[]): string {
  const frequencyMap = categoryFrequency(transactions);
  const [topCategory = "Grocery"] = Object.entries(frequencyMap).sort((a, b) => b[1] - a[1])[0] ?? [];
  return topCategory;
}

function improvementHint(topHabit: string): string {
  if (topHabit === "Food Delivery") {
    return "Replace one delivery order with a home-cooked meal to improve your score quickly.";
  }
  if (topHabit === "Fast Fashion") {
    return "Swap one fast fashion purchase for second-hand alternatives this week.";
  }
  if (topHabit === "Transport") {
    return "Batch errands and use transit for one commute day to lower transport impact.";
  }
  return "Keep leaning into grocery and durable spending categories.";
}

function explainHighImpact(ragContext: RagContext, score: ScorePayload): string {
  const topCategory = ragContext.top_categories[0] ?? "mixed spend";
  return `Your impact score is ${score.impactScore}. In the last 7 days your highest spend category is ${topCategory} with ${ragContext.high_impact_count} high-impact transactions.`;
}

export function generateChatReply(params: {
  prompt: string;
  userContext: UserContext;
  transactions: Transaction[];
  score: ScorePayload;
  insights: InsightPayload;
  ragContext: RagContext;
}): string {
  const { prompt, userContext, transactions, score, insights, ragContext } = params;
  const lowerPrompt = prompt.toLowerCase();

  const promptTemplate = buildAgentPromptTemplate({
    userContext,
    ragContext,
    userQuestion: prompt
  });

  const promptTokenCountHint = promptTemplate.split(" ").length;

  if (transactions.length === 0) {
    return "I need transaction data first. Upload your weekly CSV and I can explain your impact and next best actions.";
  }

  const topHabit = resolveTopHabit(transactions);

  if (lowerPrompt.includes("why") && lowerPrompt.includes("impact")) {
    return `${explainHighImpact(ragContext, score)} ${improvementHint(topHabit)}`;
  }

  if (lowerPrompt.includes("improve") || lowerPrompt.includes("better")) {
    return `Your fastest improvement path: ${improvementHint(topHabit)} This week spend is $${ragContext.weekly_spend} and trend is ${score.weeklyTrend.toLowerCase()}.`;
  }

  if (lowerPrompt.includes("worst") || lowerPrompt.includes("habit")) {
    return `Your highest-frequency pattern is ${topHabit}. ${insights.behaviorPatterns[0]}`;
  }

  const preferenceTag = userContext.preferences.lowIncomeMode
    ? "I will prioritize budget-friendly recommendations"
    : "I can balance sustainability and convenience";

  return `${insights.summary} ${preferenceTag}. I grounded this answer on your recent transaction context (${promptTokenCountHint} prompt tokens). Ask about impact drivers, habits, or simulations.`;
}

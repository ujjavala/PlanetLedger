import { buildAgentPromptTemplate } from "@/lib/rag/prompt-template";
import { calculateImpactScore } from "@/lib/agent/scoring-engine";
import type { RagContext } from "@/lib/rag/context-builder";
import type { AgentChatMessage, InsightPayload, ScorePayload, Transaction, UserContext } from "@/lib/types";

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

// ─── What-if simulation via natural language ──────────────────────────────────

const WHAT_IF_RE = /what\s+if\s+i\s+(?:cut|reduce|stop|limit|drop)\s+(.*?)\s+by\s+(\d+)\s*%/i;

const CATEGORY_ALIAS: Record<string, Transaction["category"]> = {
  "food delivery": "Food Delivery",
  "delivery":      "Food Delivery",
  "takeout":       "Food Delivery",
  "fast fashion":  "Fast Fashion",
  "fashion":       "Fast Fashion",
  "clothes":       "Fast Fashion",
  "transport":     "Transport",
  "uber":          "Transport",
  "cab":           "Transport",
  "taxi":          "Transport",
  "grocery":       "Grocery",
  "groceries":     "Grocery",
  "electronics":   "Electronics",
  "phone":         "Electronics",
};

function resolveCategory(alias: string): Transaction["category"] | null {
  const lower = alias.toLowerCase().trim();
  for (const [key, cat] of Object.entries(CATEGORY_ALIAS)) {
    if (lower.includes(key)) return cat;
  }
  return null;
}

function handleWhatIf(
  prompt: string,
  transactions: Transaction[],
  userContext: UserContext,
  currentScore: ScorePayload
): string | null {
  const match = WHAT_IF_RE.exec(prompt);
  if (!match) return null;

  const category = resolveCategory(match[1]);
  const percent = parseInt(match[2], 10);

  if (!category || percent <= 0 || percent > 100) {
    return `I couldn't identify "${match[1]}" as a category. Try: food delivery, fast fashion, transport, grocery, or electronics.`;
  }

  const simulated = transactions.map((tx) => {
    if (tx.category !== category) return tx;
    const reduced = Number((tx.amount * (1 - percent / 100)).toFixed(2));
    return { ...tx, amount: reduced, impact: (reduced > 20 ? "YELLOW" : "GREEN") as typeof tx.impact };
  });

  const simScore = calculateImpactScore(simulated, userContext);
  const delta = simScore.impactScore - currentScore.impactScore;

  if (delta > 0) {
    return `Reducing ${category} by ${percent}% improves your score from ${currentScore.impactScore} to ${simScore.impactScore} (+${delta} points). ${improvementHint(category)}`;
  }
  return `Reducing ${category} by ${percent}% has minimal score impact. Your main driver is ${resolveTopHabit(transactions)} — focus there for bigger gains.`;
}

// ─── Document Q&A: natural language spending queries ─────────────────────────

const SPEND_QUERY_RE = /(how much|total|spent?|spend)\b/i;

const SPEND_CATEGORY_KEYWORDS: Record<string, Transaction["category"]> = {
  "food delivery": "Food Delivery",
  "delivery":      "Food Delivery",
  "takeout":       "Food Delivery",
  "fast fashion":  "Fast Fashion",
  "fashion":       "Fast Fashion",
  "clothes":       "Fast Fashion",
  "transport":     "Transport",
  "uber":          "Transport",
  "cab":           "Transport",
  "grocery":       "Grocery",
  "groceries":     "Grocery",
  "electronics":   "Electronics",
  "phone":         "Electronics",
  "hygiene":       "Hygiene Products",
};

function handleSpendQuery(prompt: string, transactions: Transaction[]): string | null {
  if (!SPEND_QUERY_RE.test(prompt)) return null;
  const lower = prompt.toLowerCase();

  for (const [kw, category] of Object.entries(SPEND_CATEGORY_KEYWORDS)) {
    if (lower.includes(kw)) {
      const total = transactions
        .filter((tx) => tx.category === category)
        .reduce((s, tx) => s + tx.amount, 0);
      const count = transactions.filter((tx) => tx.category === category).length;
      return `You've spent $${total.toFixed(2)} on ${category} across ${count} transaction${count !== 1 ? "s" : ""} in your uploaded data.`;
    }
  }

  if (/total|overall|all/.test(lower)) {
    const total = transactions.reduce((s, tx) => s + tx.amount, 0);
    return `Your total spend across all ${transactions.length} transactions is $${total.toFixed(2)}.`;
  }
  return null;
}

// ─── Multi-turn conversation context ─────────────────────────────────────────

function buildConversationSnippet(history: AgentChatMessage[]): string {
  if (history.length < 2) return "";
  const recent = history.slice(-4); // last 2 full exchanges
  return (
    "Prior context:\n" +
    recent.map((m) => `${m.role === "user" ? "You" : "Agent"}: ${m.content}`).join("\n") +
    "\n\n"
  );
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export function generateChatReply(params: {
  prompt: string;
  userContext: UserContext;
  transactions: Transaction[];
  score: ScorePayload;
  insights: InsightPayload;
  ragContext: RagContext;
  history?: AgentChatMessage[];
}): string {
  const { prompt, userContext, transactions, score, insights, ragContext, history = [] } = params;
  const lowerPrompt = prompt.toLowerCase();
  const conversationSnippet = buildConversationSnippet(history);

  const promptTemplate = buildAgentPromptTemplate({ userContext, ragContext, userQuestion: prompt });
  const promptTokenCountHint = promptTemplate.split(" ").length;

  if (transactions.length === 0) {
    return "I need transaction data first. Upload your weekly CSV and I can explain your impact and next best actions.";
  }

  const topHabit = resolveTopHabit(transactions);

  // What-if simulation via natural language
  const whatIfReply = handleWhatIf(prompt, transactions, userContext, score);
  if (whatIfReply) return `${conversationSnippet}${whatIfReply}`;

  // Document Q&A — spending queries over uploaded transactions
  const spendReply = handleSpendQuery(prompt, transactions);
  if (spendReply) return `${conversationSnippet}${spendReply}`;

  if (lowerPrompt.includes("why") && lowerPrompt.includes("impact")) {
    return `${conversationSnippet}${explainHighImpact(ragContext, score)} ${improvementHint(topHabit)}`;
  }

  if (lowerPrompt.includes("improve") || lowerPrompt.includes("better")) {
    return `${conversationSnippet}Your fastest improvement path: ${improvementHint(topHabit)} This week spend is $${ragContext.weekly_spend} and trend is ${score.weeklyTrend.toLowerCase()}.`;
  }

  if (lowerPrompt.includes("worst") || lowerPrompt.includes("habit")) {
    return `${conversationSnippet}Your highest-frequency pattern is ${topHabit}. ${insights.behaviorPatterns[0]}`;
  }

  const preferenceTag = userContext.preferences.lowIncomeMode
    ? "I will prioritize budget-friendly recommendations"
    : "I can balance sustainability and convenience";

  return `${conversationSnippet}${insights.summary} ${preferenceTag}. I grounded this answer on your recent transaction context (${promptTokenCountHint} prompt tokens). Ask about impact drivers, habits, what-if simulations, or spending totals.`;
}

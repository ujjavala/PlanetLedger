import type { UserContext } from "@/lib/types";

import type { RagContext } from "@/lib/rag/context-builder";

export function buildAgentPromptTemplate(params: {
  userContext: UserContext;
  ragContext: RagContext;
  userQuestion: string;
}): string {
  const { userContext, ragContext, userQuestion } = params;

  // Generated with GitHub Copilot: hackathon-friendly structured prompt for pseudo-LLM reasoning.
  return [
    "You are a sustainability finance assistant.",
    "",
    "User profile:",
    `- Preferences: ${JSON.stringify(userContext.preferences)}`,
    `- Patterns: ${ragContext.patterns.join("; ")}`,
    `- Memory summary: ${(userContext.pastBehaviorSummaries ?? []).join("; ") || "No past summaries yet"}`,
    "",
    "Transaction summary:",
    `- Top categories: ${ragContext.top_categories.join(", ") || "n/a"}`,
    `- Weekly spend: ${ragContext.weekly_spend}`,
    `- High impact count: ${ragContext.high_impact_count}`,
    // Merchant names omitted from prompt — PII-adjacent, not needed for deterministic reasoning
    "",
    "Task:",
    "- Explain impact clearly",
    "- Give 1-2 actionable suggestions",
    "- Keep tone friendly and concise",
    "",
    `User question: ${userQuestion}`
  ].join("\n");
}

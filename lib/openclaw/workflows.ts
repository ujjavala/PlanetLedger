import { buildRagContext } from "@/lib/rag/context-builder";
import { buildAgentInsights } from "@/lib/agent/insight-engine";
import { getTransactions, getScore, setCachedInsights, getCachedInsights } from "@/lib/store";
import type { OpenClawEvent } from "./types";

// --- Workflow 1: Auto-insight generation on upload ---
export async function autoInsightOnUpload(event: OpenClawEvent) {
  const transactions = getTransactions(event.userId);
  const score = getScore(event.userId);
  if (!transactions.length || !score) return;
  const ragContext = buildRagContext(transactions, score);
  const insights = buildAgentInsights(transactions, event.payload?.userContext, score, ragContext);
  setCachedInsights(event.userId, insights);
}

// --- Workflow 2: High impact alert ---
export async function highImpactAlert(event: OpenClawEvent) {
  const score = getScore(event.userId);
  if (!score) return;

  if (score.impactScore < 40) {
    // Log structured alert — replace with real notification (email/push) in production
    const alert = {
      type: "HIGH_IMPACT_ALERT",
      userId: event.userId,
      impactScore: score.impactScore,
      highImpactCount: score.highImpactCount,
      weeklyTrend: score.weeklyTrend,
      message: `Your sustainability score dropped to ${score.impactScore}/100 this week with ${score.highImpactCount} high-impact transactions. Consider reducing fast fashion, food delivery, or high-spend categories.`,
      timestamp: new Date().toISOString()
    };
    // In production: await sendEmail(event.userId, alert) or await pushNotification(event.userId, alert)
    console.warn("[OpenClaw] High impact alert:", alert);
  }
}

// --- Workflow 3: Weekly report ---
export async function weeklyReport(event: OpenClawEvent) {
  const transactions = getTransactions(event.userId);
  const score = getScore(event.userId);
  if (!transactions.length) return;

  const cached = getCachedInsights(event.userId);
  const ragContext = buildRagContext(transactions, score ?? { impactScore: 0, highImpactCount: 0, weeklyTrend: "No Data" });
  const insights = cached ?? buildAgentInsights(transactions, event.payload?.userContext, score ?? { impactScore: 0, highImpactCount: 0, weeklyTrend: "No Data" }, ragContext);
  if (!cached) setCachedInsights(event.userId, insights);

  const totalSpend = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const topCategories = ragContext.top_categories;

  const report = {
    type: "WEEKLY_REPORT",
    userId: event.userId,
    week: new Date().toISOString().slice(0, 10),
    totalSpend: totalSpend.toFixed(2),
    impactScore: score?.impactScore ?? 0,
    weeklyTrend: score?.weeklyTrend ?? "No Data",
    highImpactCount: score?.highImpactCount ?? 0,
    topCategories,
    summary: insights.summary,
    topRecommendation: insights.recommendations[0] ?? "Keep tracking your sustainability journey.",
    behaviorPatterns: insights.behaviorPatterns
  };
  // In production: await sendEmail(event.userId, report) or store in DB
  console.info("[OpenClaw] Weekly report generated:", report);
}

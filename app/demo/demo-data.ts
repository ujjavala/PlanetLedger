import type { Transaction, InsightPayload, ScorePayload } from "@/lib/types";

export function buildCategoryBreakdown(transactions: Transaction[]): Record<string, { count: number; total: number }> {
  const breakdown: Record<string, { count: number; total: number }> = {};
  for (const tx of transactions) {
    const cat = tx.category ?? "Other";
    if (!breakdown[cat]) breakdown[cat] = { count: 0, total: 0 };
    breakdown[cat].count++;
    breakdown[cat].total += Math.abs(tx.amount);
  }
  return breakdown;
}

export function buildDemoInsights(transactions: Transaction[], score: ScorePayload): InsightPayload {
  const breakdown = buildCategoryBreakdown(transactions);
  return {
    summary: `Sample data: ${transactions.length} transactions · impact score ${score.impactScore}. Sign in to analyse your own data.`,
    recommendations: [
      "Consider switching fast fashion purchases to second-hand or sustainable brands.",
      "Consolidating grocery shops reduces packaging waste and carbon footprint.",
      "Sign in to get AI-powered personalised recommendations for your spending.",
    ],
    behaviorPatterns: Object.entries(breakdown)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 4)
      .map(([cat, { count, total }]) => `${cat}: ${count} transactions · $${total.toFixed(0)}`),
  };
}

export type NotificationVariant = "weekly_report" | "score_improved" | "high_impact";

export interface DemoNotificationItem {
  variant: NotificationVariant;
  color: string;
  title: string;
  body: string;
  time: string;
}

export function buildDemoNotifications(score: ScorePayload, totalSpend: number, txCount: number): DemoNotificationItem[] {
  return [
    {
      variant: "weekly_report",
      color: "bg-blue-50 border-blue-100",
      title: "Weekly Report",
      body: `This week: $${totalSpend.toFixed(0)} across ${txCount} transactions · Impact score ${score.impactScore}/100.`,
      time: "Just now",
    },
    {
      variant: "score_improved",
      color: "bg-emerald-50 border-emerald-100",
      title: "Score Improved",
      body: "Your eco score improved by 4 points this week — great progress on transport choices!",
      time: "2 days ago",
    },
    {
      variant: "high_impact",
      color: "bg-amber-50 border-amber-100",
      title: "High-Impact Alert",
      body: `${score.highImpactCount} high-impact transaction${score.highImpactCount !== 1 ? "s" : ""} detected — consider alternatives for frequent fast fashion or food delivery.`,
      time: "5 days ago",
    },
  ];
}

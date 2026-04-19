import type { ScorePayload, Transaction } from "@/lib/types";

export type Nudge = {
  type: "WARNING" | "TIP" | "CELEBRATION";
  message: string;
  priority: number; // 1 = highest
};

/**
 * Generates proactive nudges based on spending patterns and score.
 * These surface without the user explicitly asking — the agent "speaks up" early.
 */
export function generateProactiveNudges(
  transactions: Transaction[],
  score: ScorePayload
): Nudge[] {
  const nudges: Nudge[] = [];

  if (score.impactScore < 40 && score.highImpactCount >= 3) {
    nudges.push({
      type: "WARNING",
      message: `Your score is ${score.impactScore}/100 with ${score.highImpactCount} high-impact transactions. Changing one habit this week can recover 5–10 points.`,
      priority: 1,
    });
  }

  const fashionCount = transactions.filter((tx) => tx.category === "Fast Fashion").length;
  if (fashionCount >= 2) {
    nudges.push({
      type: "TIP",
      message: `${fashionCount} fast fashion purchases detected. Each uses ~2,700L of water — one second-hand swap makes a real difference.`,
      priority: 2,
    });
  }

  const deliveryCount = transactions.filter((tx) => tx.category === "Food Delivery").length;
  if (deliveryCount >= 4) {
    nudges.push({
      type: "TIP",
      message: `${deliveryCount} food deliveries this cycle. Batch-cooking one day a week can halve your packaging waste and save money.`,
      priority: 2,
    });
  }

  const transportCount = transactions.filter((tx) => tx.category === "Transport").length;
  if (transportCount >= 5) {
    nudges.push({
      type: "TIP",
      message: `${transportCount} transport transactions this week. Batching errands or using public transit for one trip can cut your transport footprint.`,
      priority: 2,
    });
  }

  if (score.impactScore >= 80) {
    nudges.push({
      type: "CELEBRATION",
      message: `Score ${score.impactScore}/100 — excellent week! Your spending is trending green. Keep it up.`,
      priority: 3,
    });
  }

  return nudges.sort((a, b) => a.priority - b.priority).slice(0, 3);
}

import { IMPACT_POINTS } from "@/lib/constants";
import type { ScorePayload, Transaction, UserContext } from "@/lib/types";

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}

function resolveWeeklyTrend(impactScore: number): string {
  if (impactScore >= 75) {
    return "Improving";
  }
  if (impactScore >= 45) {
    return "Stable";
  }
  return "Needs Attention";
}

function calculatePreferenceBonus(userContext: UserContext, highImpactCount: number): number {
  let bonus = 0;

  if (userContext.preferences.noCarOwnership) {
    bonus += 8;
  }

  if (userContext.preferences.lowIncomeMode && highImpactCount > 0) {
    bonus += 3;
  }

  return bonus;
}

export function calculateImpactScore(transactions: Transaction[], userContext: UserContext): ScorePayload {
  if (transactions.length === 0) {
    return { impactScore: 0, highImpactCount: 0, weeklyTrend: "No Data" };
  }

  // Sum points: GREEN=+10, YELLOW=+5, RED=-2
  const rawScore = transactions.reduce((total, tx) => total + IMPACT_POINTS[tx.impact], 0);
  const highImpactCount = transactions.filter((tx) => tx.impact === "RED").length;
  const preferenceBonus = calculatePreferenceBonus(userContext, highImpactCount);

  // Normalise: max possible = all GREEN (10 pts each), min = all RED (-2 pts each)
  const maxPossible = transactions.length * IMPACT_POINTS["GREEN"]; // e.g. 20 tx → 200
  const minPossible = transactions.length * IMPACT_POINTS["RED"];   // e.g. 20 tx → -40
  const range = maxPossible - minPossible;

  // Map rawScore to 0–100
  const normalised = range === 0 ? 50 : ((rawScore - minPossible) / range) * 100;
  const impactScore = clampScore(Math.round(normalised + preferenceBonus));

  return {
    impactScore,
    highImpactCount,
    weeklyTrend: resolveWeeklyTrend(impactScore)
  };
}

import { resolveUserContext, getTransactions, getScore, setScore } from "@/lib/store";
import { calculateImpactScore } from "@/lib/agent/scoring-engine";
import type { User } from "@auth0/nextjs-auth0/types";
import { fireOpenClawEvent } from "./registry";

/**
 * OpenClaw: single-event trigger (backward-compatible).
 */
export async function openClawAutoInsightTrigger(user: User) {
  const userContext = resolveUserContext(user);
  await fireOpenClawEvent({
    type: "transactions_uploaded",
    userId: userContext.userId,
    payload: { userContext },
    timestamp: new Date().toISOString(),
  });
}

/**
 * OpenClaw: chained multi-event pipeline triggered after a transaction upload.
 * Stages: uploaded → score_calculated → insights_generated → score_improved (conditional)
 */
export async function openClawChainedTrigger(
  user: User,
  previousScore?: number
) {
  const userContext = resolveUserContext(user);
  const userId = userContext.userId;

  // Stage 1: transactions uploaded — runs autoInsightOnUpload + highImpactAlert
  await fireOpenClawEvent({
    type: "transactions_uploaded",
    userId,
    payload: { userContext },
    timestamp: new Date().toISOString(),
  });

  // Stage 2: calculate and store updated score
  const transactions = getTransactions(userId);
  const newScore = calculateImpactScore(transactions, userContext);
  setScore(userId, newScore);
  await fireOpenClawEvent({
    type: "score_calculated",
    userId,
    payload: { score: newScore },
    timestamp: new Date().toISOString(),
  });

  // Stage 3: insights generated and cached
  await fireOpenClawEvent({
    type: "insights_generated",
    userId,
    payload: { userContext },
    timestamp: new Date().toISOString(),
  });

  // Stage 4: celebrate if score improved
  if (previousScore !== undefined && newScore.impactScore > previousScore) {
    await fireOpenClawEvent({
      type: "score_improved",
      userId,
      payload: {
        previousScore,
        newScore: newScore.impactScore,
        delta: newScore.impactScore - previousScore,
      },
      timestamp: new Date().toISOString(),
    });
  }
}

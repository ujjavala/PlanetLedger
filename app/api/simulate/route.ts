import { NextResponse } from "next/server";

import { calculateImpactScore } from "@/lib/agent/scoring-engine";
import { applyFoodDeliveryReduction } from "@/lib/agent/simulation";
import { authorizeAgentScope } from "@/lib/auth/agent-authorization";
import { buildRagContext } from "@/lib/rag/context-builder";
import { getTransactions } from "@/lib/store";

export async function POST(request: Request) {
  const authorization = await authorizeAgentScope("update:score");
  if (!authorization.ok) {
    return authorization.response;
  }

  const { reduceFoodDeliveryPercent = 0 } = (await request.json()) as {
    reduceFoodDeliveryPercent?: number;
  };

  const currentTransactions = getTransactions(authorization.context.userId);
  const simulatedTransactions = applyFoodDeliveryReduction(currentTransactions, reduceFoodDeliveryPercent);

  const currentScore = calculateImpactScore(currentTransactions, authorization.context);
  const simulatedScore = calculateImpactScore(simulatedTransactions, authorization.context);
  const ragContext = buildRagContext(simulatedTransactions, simulatedScore);

  const recommendation =
    simulatedScore.impactScore > currentScore.impactScore
      ? `Reducing food delivery by ${reduceFoodDeliveryPercent}% improves your score from ${currentScore.impactScore} to ${simulatedScore.impactScore}.`
      : "This change has limited impact. Try reducing high-impact categories like fast fashion too.";

  return NextResponse.json({
    currentScore,
    simulatedScore,
    improvement: simulatedScore.impactScore - currentScore.impactScore,
    ragContext,
    recommendation
  });
}

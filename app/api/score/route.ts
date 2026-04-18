import { NextResponse } from "next/server";

import { calculateImpactScore } from "@/lib/agent/scoring-engine";
import { authorizeAgentScope } from "@/lib/auth/agent-authorization";
import { getScore, getTransactions, setScore } from "@/lib/store";

export async function GET() {
  const authorization = await authorizeAgentScope("update:score");
  if (!authorization.ok) {
    return authorization.response;
  }

  const userId = authorization.context.userId;
  const transactions = getTransactions(userId);

  if (transactions.length === 0) {
    const existing = getScore(userId);
    return NextResponse.json({
      score: existing ?? {
        impactScore: 0,
        highImpactCount: 0,
        weeklyTrend: "No Data"
      }
    });
  }

  const score = calculateImpactScore(transactions, authorization.context);
  setScore(userId, score);

  return NextResponse.json({ score });
}

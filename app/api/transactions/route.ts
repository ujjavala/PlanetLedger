import { NextResponse } from "next/server";

import { authorizeAgentScope } from "@/lib/auth/agent-authorization";
import { getTransactions } from "@/lib/store";

export async function GET() {
  const authorization = await authorizeAgentScope("read:transactions");
  if (!authorization.ok) {
    return authorization.response;
  }

  const transactions = getTransactions(authorization.context.userId);
  return NextResponse.json({ transactions });
}

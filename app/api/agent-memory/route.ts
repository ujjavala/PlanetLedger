import { NextResponse } from "next/server";

import { authorizeAgentScope } from "@/lib/auth/agent-authorization";
import { getMemoryTimeline } from "@/lib/store";

export async function GET() {
  const authorization = await authorizeAgentScope("write:insights");
  if (!authorization.ok) {
    return authorization.response;
  }

  const timeline = getMemoryTimeline(authorization.context.userId);
  return NextResponse.json({ timeline });
}

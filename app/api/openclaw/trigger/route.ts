import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { openClawAutoInsightTrigger } from "@/lib/openclaw/trigger";

export const POST = async () => {
  const session = await auth0.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const insights = await openClawAutoInsightTrigger(session.user);
  return NextResponse.json({ insights });
};

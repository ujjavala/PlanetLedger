import { NextResponse } from "next/server";

import { authorizeAgentScope } from "@/lib/auth/agent-authorization";
import { getNotifications, markNotificationsRead } from "@/lib/store";

export async function GET() {
  const authorization = await authorizeAgentScope("read:transactions");
  if (!authorization.ok) return authorization.response;

  const notifications = getNotifications(authorization.context.userId);
  return NextResponse.json({ notifications });
}

export async function POST() {
  const authorization = await authorizeAgentScope("read:transactions");
  if (!authorization.ok) return authorization.response;

  markNotificationsRead(authorization.context.userId);
  return NextResponse.json({ ok: true });
}

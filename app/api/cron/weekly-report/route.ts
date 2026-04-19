import { NextResponse } from "next/server";

import { fireOpenClawEvent } from "@/lib/openclaw/registry";

/**
 * Vercel Cron: fires the weekly_report OpenClaw event for each active user.
 *
 * Schedule: every Monday at 09:00 UTC
 * Add to vercel.json:
 *   { "crons": [{ "path": "/api/cron/weekly-report", "schedule": "0 9 * * 1" }] }
 *
 * Required env vars:
 *   CRON_SECRET    — shared secret validated in the Authorization header
 *   CRON_USER_IDS  — comma-separated list of Auth0 user sub values to report on
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userIds = (process.env.CRON_USER_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  for (const userId of userIds) {
    await fireOpenClawEvent({
      type: "weekly_report",
      userId,
      timestamp: new Date().toISOString(),
    });
  }

  return NextResponse.json({
    fired: userIds.length,
    timestamp: new Date().toISOString(),
  });
}

import type { OpenClawEvent, OpenClawTrigger } from "./types";

// Registry for OpenClaw triggers
const triggers: Record<string, OpenClawTrigger[]> = {};

export function registerOpenClawTrigger(eventType: string, trigger: OpenClawTrigger) {
  if (!triggers[eventType]) triggers[eventType] = [];
  triggers[eventType].push(trigger);
}

export async function fireOpenClawEvent(event: OpenClawEvent) {
  const list = triggers[event.type] || [];
  for (const trigger of list) {
    await trigger(event);
  }
}

// --- Register default workflows ---
import { autoInsightOnUpload, highImpactAlert, weeklyReport } from "./workflows";
registerOpenClawTrigger("transactions_uploaded", autoInsightOnUpload);
registerOpenClawTrigger("transactions_uploaded", highImpactAlert);
registerOpenClawTrigger("weekly_report", weeklyReport);

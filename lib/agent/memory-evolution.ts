import { detectBehaviorPatterns } from "@/lib/agent/pattern-detector";
import type { AgentMemoryEvent, ScorePayload, Transaction } from "@/lib/types";

function weekLabelFromDate(dateIso: string): string {
  const date = new Date(dateIso);
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  return `Week of ${start.toISOString().slice(0, 10)}`;
}

export function buildMemoryEvent(transactions: Transaction[], score: ScorePayload): AgentMemoryEvent {
  const latestDate = transactions[0]?.date ?? new Date().toISOString();
  const patterns = detectBehaviorPatterns(transactions);

  return {
    id: `${Date.now()}`,
    weekLabel: weekLabelFromDate(latestDate),
    summary: patterns[0] ?? "Learning baseline spending patterns.",
    score: score.impactScore
  };
}

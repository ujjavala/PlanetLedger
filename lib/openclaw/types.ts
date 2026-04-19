// OpenClaw event and trigger types

export type OpenClawEventType =
  | "transactions_uploaded"
  | "weekly_report"
  | "high_impact_detected"
  | "behavioral_pattern_detected"
  | "score_calculated"
  | "insights_generated"
  | "score_improved"
  | "custom";

export interface OpenClawEvent {
  type: OpenClawEventType;
  userId: string;
  payload?: any;
  timestamp?: string;
}

export type OpenClawTrigger = (event: OpenClawEvent) => Promise<void>;

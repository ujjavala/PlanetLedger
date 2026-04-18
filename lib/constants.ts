import type { ImpactColor, TransactionCategory } from "@/lib/types";

export const IMPACT_POINTS: Record<ImpactColor, number> = {
  GREEN: 10,
  YELLOW: 5,
  RED: -2
};

export const DEFAULT_AGENT_SCOPES = [
  "read:transactions",
  "write:insights",
  "update:score"
] as const;

export const CATEGORY_IMPACT_RULES: Record<TransactionCategory, ImpactColor> = {
  "Fast Fashion": "RED",
  "Food Delivery": "YELLOW",
  Grocery: "GREEN",
  "Hygiene Products": "RED",
  Transport: "GREEN",
  Electronics: "RED",
  Other: "GREEN"
};

export const AGENT_COPILOT_NOTE = "Generated with GitHub Copilot";

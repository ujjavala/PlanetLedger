import { buildAgentInsights } from "@/lib/agent/insight-engine";
import { calculateImpactScore } from "@/lib/agent/scoring-engine";
import { resolveCategory, resolveImpactColor } from "@/lib/transactions/categorization";

export const normalizeCategory = resolveCategory;
export const mapImpact = resolveImpactColor;
export const scoreTransactions = calculateImpactScore;
export const generateInsights = buildAgentInsights;

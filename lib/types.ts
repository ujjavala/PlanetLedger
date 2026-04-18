export type ImpactColor = "GREEN" | "YELLOW" | "RED";

export type TransactionCategory =
  | "Fast Fashion"
  | "Food Delivery"
  | "Grocery"
  | "Hygiene Products"
  | "Transport"
  | "Electronics"
  | "Other";

export type Transaction = {
  id: string;
  merchant: string;
  amount: number;
  category: TransactionCategory;
  date: string;
  impact: ImpactColor;
};

export type AgentScope = "read:transactions" | "write:insights" | "update:score";

export type UserPreferences = {
  noCarOwnership: boolean;
  lowIncomeMode: boolean;
};

export type UserContext = {
  userId: string;
  email?: string;
  preferences: UserPreferences;
  scopes: AgentScope[];
  pastInteractions: string[];
  pastBehaviorSummaries: string[];
};

export type InsightPayload = {
  summary: string;
  recommendations: string[];
  behaviorPatterns: string[];
};

export type ScorePayload = {
  impactScore: number;
  highImpactCount: number;
  weeklyTrend: string;
};

export type AgentMemoryEvent = {
  id: string;
  weekLabel: string;
  summary: string;
  score: number;
};

export type AgentChatMessage = {
  role: "user" | "agent";
  content: string;
  createdAt: string;
};

export type DashboardPayload = {
  transactions: Transaction[];
  score: ScorePayload;
  insights: InsightPayload;
  memoryTimeline: AgentMemoryEvent[];
};

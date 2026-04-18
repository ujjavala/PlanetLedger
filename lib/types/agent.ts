// --- Auth0-Scoped Agent Types ---

export type SustainabilitySensitivity = 'low' | 'medium' | 'high';

export type AgentMemory = {
  user_id: string;
  preferences: {
    sustainabilitySensitivity: SustainabilitySensitivity;
    spendingGoals?: string[];
  };
  learnedPatterns: string[];
  lastInsights: string[];
};

export type TransactionCategory =
  | 'FAST_FASHION'
  | 'FOOD_DELIVERY'
  | 'GROCERY'
  | 'HYGIENE'
  | 'TRANSPORT';

export type ImpactTag = 'GREEN' | 'YELLOW' | 'RED';

export type Transaction = {
  id: string;
  user_id: string;
  merchant: string;
  amount: number;
  category: TransactionCategory;
  date: string;
  impactTag: ImpactTag;
  impactScore: number;
};

export type AgentInsightsResponse = {
  summary: string;
  score: number;
  breakdown: {
    green: number;
    yellow: number;
    red: number;
  };
  insights: {
    type: 'WARNING' | 'POSITIVE' | 'NEUTRAL';
    message: string;
  }[];
  recommendations: string[];
};

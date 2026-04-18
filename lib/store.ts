import type { User } from "@auth0/nextjs-auth0/types";

import { DEFAULT_AGENT_SCOPES } from "@/lib/constants";
import type { AgentChatMessage, AgentMemoryEvent, AgentScope, InsightPayload, ScorePayload, Transaction, UserContext } from "@/lib/types";

type UserMemory = {
  transactions: Transaction[];
  score?: ScorePayload;
  pastInteractions: string[];
  memoryTimeline: AgentMemoryEvent[];
  chatHistory: AgentChatMessage[];
  insightCache?: {
    cachedAt: string;
    data: InsightPayload;
  };
};

const userMemoryStore = new Map<string, UserMemory>();
const defaultScopes: AgentScope[] = [...DEFAULT_AGENT_SCOPES];

function getOrCreateMemory(userId: string): UserMemory {
  const existing = userMemoryStore.get(userId);
  if (existing) {
    return existing;
  }

  const created: UserMemory = { transactions: [], pastInteractions: [], memoryTimeline: [], chatHistory: [] };
  userMemoryStore.set(userId, created);
  return created;
}

export function resolveUserContext(user: User | null | undefined): UserContext {
  const userId = user?.sub ?? "anonymous-user";
  const memory = getOrCreateMemory(userId);

  const rawPreferences = (user?.["https://planetledger/preferences"] ?? {}) as Partial<{
    noCarOwnership: boolean;
    lowIncomeMode: boolean;
  }>;
  const rawScopes = (user?.["https://planetledger/scopes"] ?? defaultScopes) as AgentScope[];
  const rawBehaviorSummaries = (user?.["https://planetledger/agent_memory_summary"] ?? []) as string[];

  return {
    userId,
    email: user?.email,
    preferences: {
      noCarOwnership: Boolean(rawPreferences.noCarOwnership),
      lowIncomeMode: Boolean(rawPreferences.lowIncomeMode)
    },
    scopes: rawScopes.length > 0 ? rawScopes : defaultScopes,
    pastInteractions: memory.pastInteractions,
    pastBehaviorSummaries: rawBehaviorSummaries
  };
}

export function upsertTransactions(userId: string, transactions: Transaction[]) {
  const memory = getOrCreateMemory(userId);
  memory.transactions = transactions;
}

export function getTransactions(userId: string) {
  return getOrCreateMemory(userId).transactions;
}

export function setScore(userId: string, score: ScorePayload) {
  const memory = getOrCreateMemory(userId);
  memory.score = score;
}

export function getScore(userId: string) {
  return getOrCreateMemory(userId).score;
}

export function appendInteraction(userId: string, interaction: string) {
  const memory = getOrCreateMemory(userId);
  memory.pastInteractions = [interaction, ...memory.pastInteractions].slice(0, 15);
}

export function pushMemoryEvent(userId: string, event: AgentMemoryEvent) {
  const memory = getOrCreateMemory(userId);
  const deduped = memory.memoryTimeline.filter((timelineEvent) => timelineEvent.weekLabel !== event.weekLabel);
  memory.memoryTimeline = [event, ...deduped].slice(0, 12);
}

export function getMemoryTimeline(userId: string): AgentMemoryEvent[] {
  return getOrCreateMemory(userId).memoryTimeline;
}

export function appendChatMessage(userId: string, message: AgentChatMessage) {
  const memory = getOrCreateMemory(userId);
  memory.chatHistory = [...memory.chatHistory, message].slice(-30);
}

export function getChatHistory(userId: string): AgentChatMessage[] {
  return getOrCreateMemory(userId).chatHistory;
}

export function setCachedInsights(userId: string, insights: InsightPayload) {
  const memory = getOrCreateMemory(userId);
  memory.insightCache = {
    cachedAt: new Date().toISOString(),
    data: insights
  };
}

export function getCachedInsights(userId: string): InsightPayload | undefined {
  const cache = getOrCreateMemory(userId).insightCache;
  if (!cache) {
    return undefined;
  }

  const ageMs = Date.now() - new Date(cache.cachedAt).getTime();
  const maxAgeMs = 3 * 60 * 1000;
  if (ageMs > maxAgeMs) {
    return undefined;
  }

  return cache.data;
}

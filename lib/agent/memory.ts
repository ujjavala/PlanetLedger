import type { AgentMemory } from "../types/agent";

const agentMemoryStore = new Map<string, AgentMemory>();

export function getAgentMemory(user_id: string): AgentMemory {
  let memory = agentMemoryStore.get(user_id);
  if (!memory) {
    memory = {
      user_id,
      preferences: { sustainabilitySensitivity: "medium" },
      learnedPatterns: [],
      lastInsights: []
    };
    agentMemoryStore.set(user_id, memory);
  }
  return memory;
}

export function updateAgentMemory(user_id: string, update: Partial<AgentMemory>) {
  const memory = getAgentMemory(user_id);
  Object.assign(memory, update);
  agentMemoryStore.set(user_id, memory);
}

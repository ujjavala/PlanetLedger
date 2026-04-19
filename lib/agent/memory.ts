import { existsSync, mkdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from "fs";
import { join } from "path";

import type { AgentMemory } from "../types/agent";

/**
 * File-backed agent memory.
 * - Dev:        <project-root>/.agent-memory/<hash>.json
 * - Production: /tmp/planetledger-memory/<hash>.json
 *
 * File names use an FNV-1a hash of the userId so no raw Auth0 sub appears on disk.
 * Files expire after 30 days (soft-delete on next read).
 */
const MEMORY_DIR =
  process.env.NODE_ENV === "production"
    ? "/tmp/planetledger-memory"
    : join(process.cwd(), ".agent-memory");

const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function fnv1a(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

function ensureDir() {
  if (!existsSync(MEMORY_DIR)) mkdirSync(MEMORY_DIR, { recursive: true });
}

function filePath(userId: string): string {
  return join(MEMORY_DIR, `${fnv1a(userId)}.json`);
}

export function getAgentMemory(user_id: string): AgentMemory {
  ensureDir();
  const file = filePath(user_id);
  if (existsSync(file)) {
    try {
      const { mtimeMs } = statSync(file);
      if (Date.now() - mtimeMs > MAX_AGE_MS) {
        unlinkSync(file);
      } else {
        const stored = JSON.parse(readFileSync(file, "utf-8")) as Omit<AgentMemory, "user_id">;
        return { ...stored, user_id }; // restore runtime userId
      }
    } catch {
      // fall through to default
    }
  }
  return {
    user_id,
    preferences: { sustainabilitySensitivity: "medium" },
    learnedPatterns: [],
    lastInsights: [],
  };
}

export function updateAgentMemory(user_id: string, update: Partial<AgentMemory>) {
  ensureDir();
  const current = getAgentMemory(user_id);
  const updated: AgentMemory = { ...current, ...update };
  // Strip raw userId from the file — filename hash already identifies the user
  const { user_id: _id, ...rest } = updated;
  writeFileSync(filePath(user_id), JSON.stringify(rest, null, 2), "utf-8");
}

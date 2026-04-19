import type { AgentScope } from "@/lib/types";

export type FGAResource = "transactions" | "insights" | "score" | "memory" | "simulation";
export type FGAAction = "read" | "write" | "update";

type FGARule = {
  resource: FGAResource;
  action: FGAAction;
  requiredScope: AgentScope;
};

/**
 * Fine-grained authorization (FGA) rule table.
 * Every API capability is modelled as a resource + action → required scope mapping.
 * This replaces flat scope-string comparisons with explicit permission checks.
 */
const FGA_RULES: ReadonlyArray<FGARule> = [
  { resource: "transactions", action: "read",   requiredScope: "read:transactions" },
  { resource: "insights",     action: "read",   requiredScope: "read:transactions" },
  { resource: "insights",     action: "write",  requiredScope: "write:insights"    },
  { resource: "score",        action: "read",   requiredScope: "read:transactions" },
  { resource: "score",        action: "update", requiredScope: "update:score"      },
  { resource: "memory",       action: "read",   requiredScope: "read:transactions" },
  { resource: "memory",       action: "write",  requiredScope: "write:insights"    },
  { resource: "simulation",   action: "write",  requiredScope: "update:score"      },
];

/**
 * Returns true if the granted scopes allow the given resource + action.
 * Enforces principle of least privilege: explicit deny if no matching rule.
 */
export function canPerform(
  scopes: AgentScope[],
  resource: FGAResource,
  action: FGAAction
): boolean {
  const rule = FGA_RULES.find((r) => r.resource === resource && r.action === action);
  if (!rule) return false;
  return scopes.includes(rule.requiredScope);
}

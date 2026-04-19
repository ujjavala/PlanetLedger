import { NextResponse } from "next/server";

import { auth0 } from "@/lib/auth0";
import { resolveUserContext } from "@/lib/store";
import { canPerform } from "@/lib/auth/fga";
import type { FGAResource, FGAAction } from "@/lib/auth/fga";
import type { AgentScope, UserContext } from "@/lib/types";

type AuthorizationResult =
  | { ok: true; context: UserContext }
  | { ok: false; response: NextResponse };

// Maps legacy scope strings to FGA resource+action pairs for backward compatibility
const SCOPE_TO_FGA: Record<AgentScope, { resource: FGAResource; action: FGAAction }> = {
  "read:transactions": { resource: "transactions", action: "read"   },
  "write:insights":    { resource: "insights",     action: "write"  },
  "update:score":      { resource: "score",         action: "update" },
};

export async function authorizeAgentScope(
  requiredScope: AgentScope
): Promise<AuthorizationResult> {
  const session = await auth0.getSession();
  const userContext = resolveUserContext(session?.user);

  const { resource, action } = SCOPE_TO_FGA[requiredScope];
  if (!canPerform(userContext.scopes, resource, action)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: `Insufficient permissions: ${resource}:${action}` },
        { status: 403 }
      ),
    };
  }

  return { ok: true, context: userContext };
}

export { canPerform };

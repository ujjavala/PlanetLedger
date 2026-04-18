import { NextResponse } from "next/server";

import { auth0 } from "@/lib/auth0";
import { resolveUserContext } from "@/lib/store";
import type { AgentScope, UserContext } from "@/lib/types";

type AuthorizationResult =
  | { ok: true; context: UserContext }
  | { ok: false; response: NextResponse };

function hasRequiredScope(grantedScopes: string[], requiredScope: AgentScope): boolean {
  return grantedScopes.includes(requiredScope);
}

export async function authorizeAgentScope(requiredScope: AgentScope): Promise<AuthorizationResult> {
  const session = await auth0.getSession();
  const userContext = resolveUserContext(session?.user);

  // Token scopes are OIDC scopes (openid, profile, email) — not internal app scopes.
  // Internal agent scopes (read:transactions etc.) are resolved from userContext only.
  const scopeAllowedByContext = hasRequiredScope(userContext.scopes, requiredScope);

  if (!scopeAllowedByContext) {
    return {
      ok: false,
      response: NextResponse.json({ error: `Agent scope missing: ${requiredScope}` }, { status: 403 })
    };
  }

  return { ok: true, context: userContext };
}

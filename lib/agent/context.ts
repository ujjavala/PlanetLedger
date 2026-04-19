import type { NextRequest } from "next/server";

export function getUserContextFromAuth0(request: NextRequest) {
  // This is a placeholder. In production, extract user info, preferences, and scopes from Auth0 session.
  // Example:
  // const session = await getSession(request, response);
  // return {
  //   user_id: session.user.sub,
  //   email: session.user.email,
  //   preferences: session.user["https://planetledger/preferences"] || {},
  //   scopes: session.accessTokenScope.split(" "),
  // };
  return {
    user_id: "demo-user",
    // email omitted: not required for agent context
    preferences: {
      sustainabilitySensitivity: "medium"
    },
    scopes: ["read:transactions", "write:insights", "update:score", "read:behavior_patterns", "write:agent_memory"]
  };
}

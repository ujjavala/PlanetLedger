import { resolveUserContext } from "@/lib/store";
import type { User } from "@auth0/nextjs-auth0/types";
import { fireOpenClawEvent } from "./registry";

/**
 * OpenClaw: Automation event trigger (call after upload, etc)
 */
export async function openClawAutoInsightTrigger(user: User) {
  const userContext = resolveUserContext(user);
  await fireOpenClawEvent({
    type: "transactions_uploaded",
    userId: userContext.userId,
    payload: { userContext }
  });
}

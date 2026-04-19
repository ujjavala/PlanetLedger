import { NextResponse } from "next/server";

import { generateChatReply } from "@/lib/agent/chat-engine";
import { buildAgentInsights } from "@/lib/agent/insight-engine";
import { calculateImpactScore } from "@/lib/agent/scoring-engine";
import { authorizeAgentScope } from "@/lib/auth/agent-authorization";
import { buildRagContext } from "@/lib/rag/context-builder";
import { appendChatMessage, appendInteraction, getChatHistory, getTransactions } from "@/lib/store";

export async function POST(request: Request) {
  const authorization = await authorizeAgentScope("write:insights");
  if (!authorization.ok) {
    return authorization.response;
  }

  const { context } = authorization;
  const payload = (await request.json()) as { message?: string };
  const userMessage = payload.message?.trim() ?? "";

  if (!userMessage) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  const transactions = getTransactions(context.userId);
  const score = calculateImpactScore(transactions, context);
  const ragContext = buildRagContext(transactions, score);
  const insights = buildAgentInsights(transactions, context, score, ragContext);

  const agentReply = generateChatReply({
    prompt: userMessage,
    userContext: context,
    transactions,
    score,
    insights,
    ragContext,
    history: getChatHistory(context.userId),
  });

  appendChatMessage(context.userId, {
    role: "user",
    content: userMessage,
    createdAt: new Date().toISOString()
  });
  appendChatMessage(context.userId, {
    role: "agent",
    content: agentReply,
    createdAt: new Date().toISOString()
  });

  appendInteraction(context.userId, `${new Date().toISOString()}: chat exchange`);

  return NextResponse.json({
    reply: agentReply,
    history: getChatHistory(context.userId),
    ragContext
  });
}

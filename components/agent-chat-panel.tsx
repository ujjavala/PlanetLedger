"use client";

import { Lightbulb } from "lucide-react";
import { FormEvent, useState } from "react";

import type { AgentChatMessage } from "@/lib/types";

type AgentChatPanelProps = Readonly<{
  onCompleted?: () => Promise<void>;
}>;

export function AgentChatPanel({ onCompleted }: AgentChatPanelProps) {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<AgentChatMessage[]>([]);

  async function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!message.trim()) {
      return;
    }

    setIsLoading(true);
    const outgoingMessage = message;
    setMessage("");

    const response = await fetch("/api/agent-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: outgoingMessage })
    });

    if (response.ok) {
      const result = (await response.json()) as { history: AgentChatMessage[] };
      setHistory(result.history ?? []);
      if (onCompleted) {
        await onCompleted();
      }
    }

    setIsLoading(false);
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="mb-4 flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-brand-600" />
        <h2 className="text-lg font-semibold text-slate-900">Talk to your Planet Agent</h2>
      </div>

      <div className="mb-3 max-h-56 space-y-2 overflow-y-auto rounded-xl bg-slate-50 p-3">
        {history.length === 0 ? (
          <p className="text-sm text-slate-500">Ask: Why is my impact high? How can I improve?</p>
        ) : (
          history.map((entry, index) => (
            <div
              key={`${entry.createdAt}-${index}`}
              className={`rounded-lg px-3 py-2 text-sm ${
                entry.role === "user" ? "ml-8 bg-brand-600 text-white" : "mr-8 bg-white text-slate-700"
              }`}
            >
              {entry.content}
            </div>
          ))
        )}
      </div>

      <form onSubmit={submitMessage} className="flex gap-2">
        <input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
          placeholder="Ask your agent..."
        />
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {isLoading ? "..." : "Send"}
        </button>
      </form>
    </section>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Globe, Lock, Bot, Leaf } from "lucide-react";

import { AgentChatPanel } from "@/components/agent-chat-panel";
import { Gamification } from "@/components/gamification";
import { InsightPanel } from "@/components/insight-panel";
import { MemoryEvolutionPanel } from "@/components/memory-evolution-panel";
import { NotificationBell } from "@/components/notification-bell";
import { Sidebar } from "@/components/sidebar";
import { SummaryCards } from "@/components/summary-cards";
import { TransactionTable } from "@/components/transaction-table";
import { UploadPanel } from "@/components/upload-panel";
import { WhatIfSimulator } from "@/components/what-if-simulator";
import type { AgentMemoryEvent, InsightPayload, Transaction } from "@/lib/types";

type DashboardShellProps = Readonly<{
  email?: string;
}>;

const emptyInsights: InsightPayload = {
  summary: "Upload data to activate the PlanetLedger agent.",
  recommendations: ["Add at least one week of spend data in CSV format."],
  behaviorPatterns: ["Behavior analysis will appear here after upload."]
};

export function DashboardShell({ email }: DashboardShellProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [impactScore, setImpactScore] = useState(0);
  const [highImpactCount, setHighImpactCount] = useState(0);
  const [weeklyTrend, setWeeklyTrend] = useState("No Data");
  const [insights, setInsights] = useState<InsightPayload>(emptyInsights);
  const [memoryTimeline, setMemoryTimeline] = useState<AgentMemoryEvent[]>([]);

  const totalSpend = useMemo(() => transactions.reduce((sum, tx) => sum + tx.amount, 0), [transactions]);

  async function fetchTransactions() {
    const response = await fetch("/api/transactions");
    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as { transactions: Transaction[] };
    setTransactions(payload.transactions ?? []);
  }

  async function fetchScore() {
    const response = await fetch("/api/score");
    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as {
      score: { impactScore: number; highImpactCount: number; weeklyTrend: string };
    };
    setImpactScore(payload.score?.impactScore ?? 0);
    setHighImpactCount(payload.score?.highImpactCount ?? 0);
    setWeeklyTrend(payload.score?.weeklyTrend ?? "No Data");
  }

  async function fetchInsightsAndMemory() {
    const response = await fetch("/api/agent-insights");
    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as {
      summary?: string;
      recommendations?: string[];
      insights?: { type: string; message: string }[];
      memory?: { learnedPatterns?: string[] };
      memoryTimeline?: AgentMemoryEvent[];
    };

    // Map flat API response → InsightPayload shape
    setInsights({
      summary: payload.summary ?? emptyInsights.summary,
      recommendations: payload.recommendations ?? [],
      behaviorPatterns: payload.insights?.map((i) => i.message) ?? []
    });
    setMemoryTimeline(payload.memoryTimeline ?? []);
  }

  const refresh = useCallback(async () => {
    await Promise.all([fetchTransactions(), fetchScore(), fetchInsightsAndMemory()]);
  }, []);

  useEffect(() => {
    refresh().catch(() => undefined);
  }, [refresh]);

  return (
    <main className="fade-in min-h-screen p-4 lg:p-8">
      <div className="mx-auto flex max-w-7xl gap-5">
        <Sidebar email={email} />

        <div className="flex-1 space-y-4" id="home">
          <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-800 via-green-700 to-teal-700 p-6 text-white shadow-xl">
            {/* Decorative orbs */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/5" />
            <div className="pointer-events-none absolute -bottom-12 left-8 h-52 w-52 rounded-full bg-black/10" />

            <div className="relative flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <Globe className="h-5 w-5 text-emerald-300" />
                  <a href="/" className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300 hover:text-white transition">PlanetLedger</a>
                </div>
                {email ? (
                  <>
                    <h2 className="text-2xl font-bold">Welcome back</h2>
                    <p className="mt-0.5 max-w-xs truncate text-sm text-emerald-100">{email}</p>
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold">Your sustainability dashboard</h2>
                    <p className="mt-0.5 text-sm text-emerald-100">Sign in to personalise your agent and save progress.</p>
                  </>
                )}
              </div>

              <div className="flex flex-col items-end gap-2">
                {email ? (
                  <div className="flex items-center gap-2">
                    <NotificationBell />
                    <a
                      href="/auth/logout"
                      className="rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
                    >
                      Sign out
                    </a>
                  </div>
                ) : (
                  <a
                    href="/auth/login"
                    className="rounded-xl bg-white px-5 py-2 text-sm font-bold text-emerald-800 shadow-lg transition hover:bg-emerald-50"
                  >
                    Sign in with Auth0
                  </a>
                )}
                <div className="flex items-center gap-1.5 text-xs text-emerald-300">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  Secured by Auth0
                </div>
              </div>
            </div>

            <div className="relative mt-5 flex flex-wrap gap-2">
              {([
                { Icon: Lock,    label: "Bank-grade security" },
                { Icon: Bot,     label: "AI-powered insights" },
                { Icon: Leaf,    label: "CO₂ tracked per spend" },
              ] as const).map(({ Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-emerald-100 backdrop-blur"
                >
                  <Icon className="h-3.5 w-3.5" />{label}
                </span>
              ))}
            </div>
          </header>

          <UploadPanel onUploaded={refresh} />

          <div id="impact-score">
            <SummaryCards
              totalSpend={totalSpend}
              impactScore={impactScore}
              highImpactCount={highImpactCount}
              weeklyTrend={weeklyTrend}
            />
          </div>

          <div id="transactions" className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
            <TransactionTable transactions={transactions} />
            <Gamification impactScore={impactScore} />
          </div>

          <div id="insights">
            <InsightPanel insights={insights} />
          </div>

          {email && (
            <div className="grid gap-4 xl:grid-cols-2">
              <AgentChatPanel onCompleted={refresh} />
              <WhatIfSimulator onCompleted={refresh} />
            </div>
          )}

          {email && <MemoryEvolutionPanel timeline={memoryTimeline} />}

          <section id="profile" className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-card">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Your Profile</h3>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs text-slate-500">Signed in as</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">{email ?? "Anonymous"}</p>
              </div>
              {email ? (
                <a
                  href="/auth/logout"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                >
                  Sign out
                </a>
              ) : (
                <a
                  href="/auth/login"
                  className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
                >
                  Sign in
                </a>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

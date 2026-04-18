import * as fs from "fs";
import * as path from "path";
import { parseTransactionsCsv } from "@/lib/transactions/csv-parser";
import { calculateImpactScore } from "@/lib/agent/scoring-engine";
import { SummaryCards } from "@/components/summary-cards";
import { TransactionTable } from "@/components/transaction-table";
import { InsightPanel } from "@/components/insight-panel";
import { LockedPanelsRow } from "./locked-panels";
import type { InsightPayload } from "@/lib/types";

export default function DemoPage() {
  // Load and parse sample data at request time — no HTTP round-trips, bypasses middleware
  const csvText = fs.readFileSync(
    path.join(process.cwd(), "sample-transactions.csv"),
    "utf-8"
  );
  const transactions = parseTransactionsCsv(csvText);
  const score = calculateImpactScore(transactions, {
    userId: "demo",
    scopes: [],
    preferences: { noCarOwnership: false, lowIncomeMode: false },
    pastInteractions: [],
    pastBehaviorSummaries: [],
  });

  const totalSpend = transactions.reduce((s, t) => s + t.amount, 0);

  // Category breakdown
  const breakdown: Record<string, { count: number; total: number }> = {};
  for (const tx of transactions) {
    const cat = tx.category ?? "Other";
    if (!breakdown[cat]) breakdown[cat] = { count: 0, total: 0 };
    breakdown[cat].count++;
    breakdown[cat].total += Math.abs(tx.amount);
  }

  const insights: InsightPayload = {
    summary: `Sample data: ${transactions.length} transactions · impact score ${score.impactScore}. Sign in to analyse your own data.`,
    recommendations: [
      "Consider switching fast fashion purchases to second-hand or sustainable brands.",
      "Consolidating grocery shops reduces packaging waste and carbon footprint.",
      "Sign in to get AI-powered personalised recommendations for your spending.",
    ],
    behaviorPatterns: Object.entries(breakdown)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 4)
      .map(([cat, { count, total }]) => `${cat}: ${count} transactions · $${total.toFixed(0)}`),
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 w-full bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <a href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="PlanetLedger" className="h-9 w-9 rounded-full shadow" />
            <span className="text-base font-bold text-slate-900 tracking-tight">PlanetLedger</span>
          </a>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              Demo mode · sample data
            </span>
            <a
              href="/auth/login?returnTo=/dashboard"
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white shadow transition hover:bg-brand-700"
            >
              Sign in → full dashboard
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        <div className="rounded-2xl bg-gradient-to-br from-emerald-800 via-green-700 to-teal-700 p-6 text-white shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300 mb-1">Demo</p>
          <h1 className="text-2xl font-bold">Sample sustainability dashboard</h1>
          <p className="mt-1 text-sm text-emerald-100">
            Live preview using AU sample data — no login required. Rules-only · nothing is stored.
          </p>
          <a
            href="/auth/login?returnTo=/dashboard"
            className="mt-4 inline-block rounded-xl bg-white px-5 py-2 text-sm font-bold text-emerald-800 shadow transition hover:bg-emerald-50"
          >
            Sign in to analyse your own data →
          </a>
        </div>

        <SummaryCards
          totalSpend={totalSpend}
          impactScore={score.impactScore}
          highImpactCount={score.highImpactCount}
          weeklyTrend={score.weeklyTrend}
        />

        <TransactionTable transactions={transactions} />

        <InsightPanel insights={insights} />

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3 px-1">
            Premium features — sign in to unlock
          </p>
          <LockedPanelsRow />
          <p className="mt-4 text-center text-xs text-slate-400">
            <a href="/auth/login?returnTo=/dashboard" className="text-brand-600 font-semibold hover:underline">Sign in with Auth0</a> to unlock AI chat, memory tracking, and what-if simulations.
          </p>
        </div>
      </div>
    </main>
  );
}

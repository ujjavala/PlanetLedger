import type { AgentScope } from "@/lib/types";
import { SAMPLE_CSV } from "@/lib/demo/sample-data";
import { parseTransactionsCsv } from "@/lib/transactions/csv-parser";
import { calculateImpactScore } from "@/lib/agent/scoring-engine";
import { SummaryCards } from "@/components/summary-cards";
import { TransactionTable } from "@/components/transaction-table";
import { InsightPanel } from "@/components/insight-panel";
import { DemoHeader } from "./demo-header";
import { DemoHero } from "./demo-hero";
import { DemoWeeklySummary } from "./demo-weekly-summary";
import { DemoNotifications } from "./demo-notifications";
import { LockedPanelsRow } from "./locked-panels";
import { buildDemoInsights, buildDemoNotifications } from "./demo-data";

const DEMO_USER_CONTEXT = {
  userId: "demo",
  scopes: [] as AgentScope[],
  preferences: { noCarOwnership: false, lowIncomeMode: false },
  pastInteractions: [] as string[],
  pastBehaviorSummaries: [] as string[],
};

export default function DemoPage() {
  const transactions = parseTransactionsCsv(SAMPLE_CSV);
  const score = calculateImpactScore(transactions, DEMO_USER_CONTEXT);
  const totalSpend = transactions.reduce((s, t) => s + t.amount, 0);
  const insights = buildDemoInsights(transactions, score);
  const notifications = buildDemoNotifications(score, totalSpend, transactions.length);

  return (
    <main className="min-h-screen bg-slate-50">
      <DemoHeader />

      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        <DemoHero />

        <SummaryCards
          totalSpend={totalSpend}
          impactScore={score.impactScore}
          highImpactCount={score.highImpactCount}
          weeklyTrend={score.weeklyTrend}
        />

        <TransactionTable transactions={transactions} />

        <InsightPanel insights={insights} />

        <DemoWeeklySummary {...score} totalSpend={totalSpend} />

        <DemoNotifications notifications={notifications} />

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3 px-1">
            Premium features — sign in to unlock
          </p>
          <LockedPanelsRow />
          <p className="mt-4 text-center text-xs text-slate-400">
            <a href="/auth/login?returnTo=/dashboard" className="text-brand-600 font-semibold hover:underline">
              Sign in with Auth0
            </a>{" "}
            to unlock AI chat, memory tracking, and what-if simulations.
          </p>
        </div>
      </div>
    </main>
  );
}


import { Lightbulb } from "lucide-react";

import type { InsightPayload } from "@/lib/types";

export function InsightPanel({ insights }: Readonly<{ insights: InsightPayload }>) {
  return (
    <section id="insights" className="rounded-2xl border border-amber-100 bg-amber-50/40 p-5 shadow-card">
      <div className="mb-4 flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-amber-600" />
        <h2 className="text-lg font-semibold text-slate-900">Agent Insight Panel</h2>
      </div>

      <p className="mb-4 text-sm text-slate-700">{insights.summary}</p>

      <div className="grid gap-4 md:grid-cols-2">
        <article>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Recommendations</h3>
          <ul className="mt-2 space-y-2 text-sm text-slate-700">
            {(insights.recommendations ?? []).map((tip, idx) => (
              <li key={`${tip}-${idx}`} className="rounded-lg bg-white p-2">
                {tip}
              </li>
            ))}
          </ul>
        </article>

        <article>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Behavior Patterns</h3>
          <ul className="mt-2 space-y-2 text-sm text-slate-700">
            {(insights.behaviorPatterns ?? []).map((pattern, idx) => (
              <li key={`${pattern}-${idx}`} className="rounded-lg bg-white p-2">
                {pattern}
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}

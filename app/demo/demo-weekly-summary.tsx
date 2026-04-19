import { BarChart3 } from "lucide-react";
import type { ScorePayload } from "@/lib/types";

interface Props extends ScorePayload {
  totalSpend: number;
}

const TREND_COLOUR: Record<string, string> = {
  Improving: "text-emerald-600",
  Stable: "text-amber-500",
  "Needs Attention": "text-red-500",
};

function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

export function DemoWeeklySummary({ impactScore, totalSpend, highImpactCount, weeklyTrend }: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="h-4 w-4 text-slate-500" />
        <h2 className="text-sm font-bold text-slate-900">Weekly Summary</h2>
        <span className="ml-auto rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
          Sample report
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        <Stat value={impactScore} label="Impact score" />
        <Stat value={`$${totalSpend.toFixed(0)}`} label="Total spend" />
        <Stat value={highImpactCount} label="High-impact txns" />
        <div>
          <p className={`text-2xl font-bold ${TREND_COLOUR[weeklyTrend] ?? "text-slate-900"}`}>
            {weeklyTrend}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Trend</p>
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-400 border-t border-slate-100 pt-3">
        Sign in to get weekly reports delivered to your notification bell automatically every Monday.
      </p>
    </div>
  );
}

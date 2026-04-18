type GamificationProps = Readonly<{
  impactScore: number;
}>;

const BADGES = [
  { label: "Conscious Spender", threshold: 40, emoji: "🌱" },
  { label: "Low Impact Week",   threshold: 65, emoji: "♻️" },
  { label: "Planet Saver",      threshold: 85, emoji: "🌍" },
];

function ScoreDial({ score }: { score: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(score, 100) / 100;
  const dash = pct * circ;
  const color = score >= 70 ? "#16a34a" : score >= 40 ? "#f59e0b" : "#ef4444";
  const label = score >= 70 ? "Great" : score >= 40 ? "Fair" : "Needs work";
  return (
    <div className="relative flex h-36 w-36 items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <circle
          cx="60" cy="60" r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
      </svg>
      <div className="text-center">
        <p className="text-3xl font-extrabold text-slate-900 leading-none">{score}</p>
        <p className="mt-0.5 text-xs font-semibold" style={{ color }}>{label}</p>
        <p className="text-[10px] text-slate-400">/100</p>
      </div>
    </div>
  );
}

export function Gamification({ impactScore }: GamificationProps) {
  const unlocked = BADGES.filter((b) => impactScore >= b.threshold);
  const next = BADGES.find((b) => impactScore < b.threshold);

  return (
    <section id="impact-score" className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <h2 className="text-lg font-semibold text-slate-900">Planet Impact Score</h2>

      <div className="flex items-center gap-6">
        <ScoreDial score={impactScore} />
        <div className="flex-1 space-y-3">
          {unlocked.length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Earned badges</p>
              <div className="flex flex-wrap gap-2">
                {unlocked.map((b) => (
                  <span key={b.label} className="flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                    {b.emoji} {b.label}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Upload more data to earn your first badge.</p>
          )}

          {next && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Next badge</p>
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                <span className="text-base">{next.emoji}</span>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-700">{next.label}</p>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-brand-500 transition-all"
                      style={{ width: `${Math.min((impactScore / next.threshold) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs text-slate-400">{next.threshold - impactScore} pts</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

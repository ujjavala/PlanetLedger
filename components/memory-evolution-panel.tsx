import type { AgentMemoryEvent } from "@/lib/types";

type MemoryEvolutionPanelProps = Readonly<{
  timeline: AgentMemoryEvent[];
}>;

export function MemoryEvolutionPanel({ timeline }: MemoryEvolutionPanelProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <h2 className="text-lg font-semibold text-slate-900">How Your Agent Learned About You</h2>
      <div className="mt-4 space-y-3">
        {timeline.length === 0 ? (
          <p className="text-sm text-slate-600">Timeline will populate after your first insights cycle.</p>
        ) : (
          timeline.map((event) => (
            <article key={event.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">{event.weekLabel}</p>
              <p className="mt-1 text-sm text-slate-700">{event.summary}</p>
              <p className="mt-1 text-xs text-brand-700">Impact score: {event.score}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

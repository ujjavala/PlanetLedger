"use client";

import { useEffect, useState } from "react";

type WhatIfSimulatorProps = Readonly<{
  onCompleted?: () => Promise<void>;
}>;

type SimulationResult = {
  currentScore: { impactScore: number };
  simulatedScore: { impactScore: number };
  improvement: number;
  recommendation: string;
};

export function WhatIfSimulator({ onCompleted }: WhatIfSimulatorProps) {
  const [reduction, setReduction] = useState(20);
  const [result, setResult] = useState<SimulationResult | null>(null);

  useEffect(() => {
    async function runSimulation() {
      const response = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reduceFoodDeliveryPercent: reduction })
      });

      if (response.ok) {
        const data = (await response.json()) as SimulationResult;
        setResult(data);
        if (onCompleted) {
          await onCompleted();
        }
      }
    }

    runSimulation().catch(() => undefined);
  }, [onCompleted, reduction]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <h2 className="text-lg font-semibold text-slate-900">What-if Simulator</h2>
      <p className="mt-1 text-sm text-slate-600">Reduce food delivery by {reduction}%</p>
      <input
        type="range"
        min={0}
        max={80}
        value={reduction}
        onChange={(event) => setReduction(Number(event.target.value))}
        className="mt-3 w-full accent-brand-600"
      />

      {result ? (
        <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
          <p>
            Impact score: {result.currentScore.impactScore} {"->"} {result.simulatedScore.impactScore} ({result.improvement >= 0 ? "+" : ""}
            {result.improvement})
          </p>
          <p className="mt-2">{result.recommendation}</p>
        </div>
      ) : null}
    </section>
  );
}

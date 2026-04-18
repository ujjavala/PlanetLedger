"use client";

import { Bot, BrainCircuit, FlaskConical, Lock } from "lucide-react";

const PANELS = [
  {
    title: "AI Agent Chat",
    icon: Bot,
    desc: "Ask your personal AI agent anything about your spending habits and get personalised sustainability advice.",
  },
  {
    title: "What-If Simulator",
    icon: FlaskConical,
    desc: "Simulate swapping categories and see how your impact score changes in real time.",
  },
  {
    title: "Memory Evolution",
    icon: BrainCircuit,
    desc: "Track how your agent learns your patterns and improves its insights over time.",
  },
];

export function LockedPanelsRow() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {PANELS.map(({ title, icon: Icon, desc }) => (
        <div
          key={title}
          className="relative rounded-2xl border border-slate-200 bg-white shadow-card overflow-hidden min-h-[160px]"
        >
          {/* Lock overlay */}
          <div className="absolute inset-0 bg-white/80 backdrop-blur-[3px] z-10 flex items-center justify-center">
            <Lock className="h-6 w-6 text-slate-300" />
          </div>
          {/* Ghosted content underneath */}
          <div className="p-5 select-none pointer-events-none opacity-30">
            <div className="flex items-center gap-2 mb-3">
              <Icon className="h-4 w-4 text-slate-500" />
              <h2 className="text-sm font-bold text-slate-900">{title}</h2>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
            <div className="mt-3 space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-3 rounded bg-slate-200 w-full" />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

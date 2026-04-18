"use client";

import { useState } from "react";
import { Car, Cpu, Leaf, Shirt, Utensils, ShoppingBag, ChevronDown, ChevronUp } from "lucide-react";

import type { Transaction } from "@/lib/types";

const CATEGORY_META: Record<Transaction["category"], {
  icon: React.ReactNode;
  color: string;
  bg: string;
  border: string;
}> = {
  "Fast Fashion":     { icon: <Shirt className="h-4 w-4" />,    color: "text-rose-700",    bg: "bg-rose-50",    border: "border-rose-200" },
  "Food Delivery":    { icon: <Utensils className="h-4 w-4" />, color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200" },
  "Grocery":          { icon: <ShoppingBag className="h-4 w-4" />, color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  "Hygiene Products": { icon: <Leaf className="h-4 w-4" />,     color: "text-purple-700",  bg: "bg-purple-50",  border: "border-purple-200" },
  "Transport":        { icon: <Car className="h-4 w-4" />,      color: "text-sky-700",     bg: "bg-sky-50",     border: "border-sky-200" },
  "Electronics":      { icon: <Cpu className="h-4 w-4" />,      color: "text-indigo-700",  bg: "bg-indigo-50",  border: "border-indigo-200" },
  "Other":            { icon: <ShoppingBag className="h-4 w-4" />, color: "text-slate-600", bg: "bg-slate-50",   border: "border-slate-200" },
};

function impactDot(impact: Transaction["impact"]) {
  if (impact === "GREEN")  return "bg-emerald-500";
  if (impact === "YELLOW") return "bg-amber-400";
  return "bg-rose-500";
}

type CategorySummary = {
  category: Transaction["category"];
  total: number;
  count: number;
  dominantImpact: Transaction["impact"];
  transactions: Transaction[];
};

function buildSummaries(transactions: Transaction[]): CategorySummary[] {
  const map = new Map<Transaction["category"], CategorySummary>();
  for (const tx of transactions) {
    const existing = map.get(tx.category);
    if (existing) {
      existing.total += tx.amount;
      existing.count += 1;
      existing.transactions.push(tx);
    } else {
      map.set(tx.category, {
        category: tx.category,
        total: tx.amount,
        count: 1,
        dominantImpact: tx.impact,
        transactions: [tx],
      });
    }
  }
  // sort by absolute spend descending
  return [...map.values()].sort((a, b) => Math.abs(b.total) - Math.abs(a.total));
}

export function TransactionTable({ transactions }: Readonly<{ transactions: Transaction[] }>) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (transactions.length === 0) {
    return (
      <section id="transactions" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
        <h2 className="mb-2 text-lg font-semibold text-slate-900">Spend by Category</h2>
        <p className="text-sm text-slate-500">Upload a CSV to see your spending breakdown.</p>
      </section>
    );
  }

  const summaries = buildSummaries(transactions);
  const totalSpend = summaries.reduce((s, c) => s + Math.abs(c.total), 0);

  return (
    <section id="transactions" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Spend by Category</h2>
        <span className="text-xs text-slate-400">{transactions.length} transactions</span>
      </div>

      <div className="space-y-2">
        {summaries.map((s) => {
          const meta = CATEGORY_META[s.category];
          const pct = totalSpend > 0 ? (Math.abs(s.total) / totalSpend) * 100 : 0;
          const isOpen = expanded === s.category;
          return (
            <div key={s.category} className={`rounded-xl border ${meta.border} overflow-hidden`}>
              <button
                className={`w-full flex items-center gap-3 px-4 py-3 ${meta.bg} text-left transition hover:brightness-95`}
                onClick={() => setExpanded(isOpen ? null : s.category)}
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ${meta.color}`}>
                  {meta.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-semibold ${meta.color}`}>{s.category}</span>
                    <span className="text-sm font-bold text-slate-800">${Math.abs(s.total).toFixed(2)}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/60">
                      <div className="h-full rounded-full bg-current opacity-50" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="shrink-0 text-xs text-slate-500">{pct.toFixed(0)}% · {s.count} txn</span>
                  </div>
                </div>
                <span className={`ml-2 shrink-0 ${meta.color} opacity-60`}>
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </span>
              </button>

              {isOpen && (
                <div className="divide-y divide-slate-100 bg-white">
                  {s.transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between px-4 py-2 text-xs text-slate-600">
                      <span className="min-w-0 flex-1 truncate pr-4">{tx.merchant}</span>
                      <span className={`mr-3 h-2 w-2 shrink-0 rounded-full ${impactDot(tx.impact)}`} />
                      <span className="shrink-0 font-medium tabular-nums">
                        {tx.amount < 0 ? "-" : "+"}${Math.abs(tx.amount).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

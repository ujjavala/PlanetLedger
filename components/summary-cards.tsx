import { AlertTriangle, CreditCard, Leaf, TrendingUp } from "lucide-react";

type SummaryCardsProps = Readonly<{
  totalSpend: number;
  impactScore: number;
  highImpactCount: number;
  weeklyTrend: string;
}>;

const cards = [
  {
    key: "totalSpend",
    title: "Total Spend",
    icon: CreditCard
  },
  {
    key: "impactScore",
    title: "Impact Score",
    icon: Leaf
  },
  {
    key: "highImpactCount",
    title: "High Impact Count",
    icon: AlertTriangle
  },
  {
    key: "weeklyTrend",
    title: "Weekly Trend",
    icon: TrendingUp
  }
] as const;

export function SummaryCards({ totalSpend, impactScore, highImpactCount, weeklyTrend }: SummaryCardsProps) {
  const values = {
    totalSpend: `$${totalSpend.toFixed(2)}`,
    impactScore: `${impactScore}/100`,
    highImpactCount: `${highImpactCount}`,
    weeklyTrend
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <article
            key={card.key}
            className="slide-up rounded-2xl border border-slate-200 bg-white p-4 shadow-card"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-600">{card.title}</p>
              <Icon className="h-5 w-5 text-brand-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{values[card.key]}</p>
          </article>
        );
      })}
    </div>
  );
}

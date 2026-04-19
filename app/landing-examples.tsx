import { Shirt, Car, Smartphone, AlertTriangle, Leaf } from "lucide-react";

const examples = [
  {
    icon: <Shirt className="h-6 w-6 text-rose-600" />, // Zara T-shirt
    title: "T-shirt Haul",
    impact: "~2.1kg CO₂, 2,700L water",
    fact: "A single fast fashion tee can use enough water for 30 showers."
  },
  {
    icon: <Car className="h-6 w-6 text-yellow-600" />, // Uber/Cab
    title: "Uber/Cab Ride",
    impact: "~1.5kg CO₂ per 10km",
    fact: "A solo rideshare can emit 50% more than public transit."
  },
  {
    icon: <Smartphone className="h-6 w-6 text-blue-600" />, // Smartphone
    title: "New Smartphone",
    impact: "~70kg CO₂, rare earth mining",
    fact: "Making one phone uses more energy than charging it for 10 years."
  },
  {
    icon: <AlertTriangle className="h-6 w-6 text-orange-600" />, // Food delivery
    title: "Late-night Food Delivery",
    impact: "Medium CO₂, high packaging waste",
    fact: "Delivery meals can double your weekly packaging waste."
  }
];

export function LandingExamples() {
  return (
    <section className="mx-auto max-w-2xl py-8">
      <h2 className="mb-4 text-2xl font-bold text-slate-900 text-center">
        What if you could instantly see the impact of...
      </h2>
      <div className="grid gap-5 sm:grid-cols-2">
        {examples.map((ex) => (
          <div key={ex.title} className="flex flex-col items-center rounded-xl border border-slate-200 bg-white p-5 shadow-card">
            {ex.icon}
            <h3 className="mt-2 text-lg font-semibold text-slate-800">{ex.title}</h3>
            <p className="mt-1 text-sm text-brand-700">{ex.impact}</p>
            <p className="mt-2 text-xs text-slate-500 text-center">{ex.fact}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 text-center">
        <p className="text-lg font-semibold text-brand-700">
          PlanetLedger translates your spending into real environmental insights.
        </p>
        <p className="mt-2 text-sm text-slate-700">
          See your impact score, get actionable tips, and watch your habits evolve—powered by Auth0 agents and real data.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            🌱 Understand your spending impact
          </span>
          <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
            📊 Category breakdown per transaction
          </span>
          <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
            🤖 AI-powered merchant classification
          </span>
        </div>
      </div>
    </section>
  );
}

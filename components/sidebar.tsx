// Use <a> for hash navigation instead of Next.js Link
import { Home, Leaf, Lightbulb, List, User } from "lucide-react";

const navItems = [
  { label: "Home", icon: Home, href: "#home" },
  { label: "Transactions", icon: List, href: "#transactions" },
  { label: "Impact Score", icon: Leaf, href: "#impact-score" },
  { label: "Insights", icon: Lightbulb, href: "#insights" },
  { label: "Profile", icon: User, href: "#profile" }
] as const;

export function Sidebar({ email }: Readonly<{ email?: string }>) {
  return (
    <aside className="soft-grid hidden w-72 shrink-0 flex-col rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-card lg:flex">
      <div className="mb-8">
        <a href="/" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 hover:text-brand-600 transition">PlanetLedger</a>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Sustainability Finance Agent</h1>
      </div>

      <nav className="space-y-2">
        {navItems.map(({ label, icon: Icon, href }) => (
          <a
            key={label}
            href={href}
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-brand-50 hover:text-brand-700"
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </a>
        ))}
      </nav>

      <div className="mt-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs uppercase tracking-wide text-slate-500">Signed in as</p>
        <p className="mt-1 truncate text-sm font-semibold text-slate-900">{email ?? "Anonymous Mode"}</p>
      </div>
    </aside>
  );
}

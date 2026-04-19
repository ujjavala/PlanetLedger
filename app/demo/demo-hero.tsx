export function DemoHero() {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-emerald-800 via-green-700 to-teal-700 p-6 text-white shadow-xl">
      <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300 mb-1">Demo</p>
      <h1 className="text-2xl font-bold">Sample sustainability dashboard</h1>
      <p className="mt-1 text-sm text-emerald-100">
        Live preview using AU sample data — no login required. Rules-only · nothing is stored.
      </p>
      <a
        href="/auth/login?returnTo=/dashboard"
        className="mt-4 inline-block rounded-xl bg-white px-5 py-2 text-sm font-bold text-emerald-800 shadow transition hover:bg-emerald-50"
      >
        Sign in to analyse your own data →
      </a>
    </div>
  );
}

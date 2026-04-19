export function DemoHeader() {
  return (
    <header className="sticky top-0 z-30 w-full bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <a href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="PlanetLedger" className="h-9 w-9 rounded-full shadow" />
          <span className="text-base font-bold text-slate-900 tracking-tight">PlanetLedger</span>
        </a>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-block rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            Demo mode · sample data
          </span>
          <a
            href="/auth/login?returnTo=/dashboard"
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white shadow transition hover:bg-brand-700"
          >
            Sign in → full dashboard
          </a>
        </div>
      </div>
    </header>
  );
}

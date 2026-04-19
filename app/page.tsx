import { LandingExamples } from "./landing-examples";
import { LoginButton } from "../components/login-button";
import { Globe, Lock, Zap, Leaf, Building2 } from "lucide-react";

function TopNav() {
  return (
    <header className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur border-b border-slate-200">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <a href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="PlanetLedger Logo" className="h-12 w-12 rounded-full shadow-md" />
            <span className="ml-2 text-lg font-bold text-slate-900 tracking-tight">PlanetLedger</span>
          </a>
        </div>
        <nav className="hidden md:flex gap-8 text-sm font-semibold items-center">
          <a href="#features" className="px-3 py-1 rounded transition text-slate-800 hover:text-white hover:bg-brand-600 focus:bg-brand-700 focus:text-white">Features</a>
          <a href="#how" className="px-3 py-1 rounded transition text-slate-800 hover:text-white hover:bg-brand-600 focus:bg-brand-700 focus:text-white">How it works</a>
          <a href="/demo" className="px-3 py-1 rounded transition text-slate-800 hover:text-white hover:bg-brand-600 focus:bg-brand-700 focus:text-white">Demo</a>
          <LoginButton />
        </nav>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="relative flex flex-col items-center justify-center min-h-[60vh] py-24 px-6 text-center bg-gradient-to-br from-emerald-50 via-white to-slate-100 overflow-hidden">
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-emerald-200/40 to-transparent rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gradient-to-tr from-yellow-400/10 to-transparent rounded-full blur-3xl" />

      <span className="relative mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-emerald-700">
        <Globe className="h-3.5 w-3.5" /> AI-Powered Sustainability Finance
      </span>

      <h1 className="relative mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
        Your spending,{" "}
        <span className="text-brand-600">decoded for the planet</span>
      </h1>

      <p className="relative mx-auto mt-5 max-w-xl text-base text-slate-600 md:text-lg">
        Upload a transaction summary and your AI agent instantly surfaces your carbon footprint, flags high-impact habits, and recommends greener alternatives.
      </p>

      <div className="relative mt-8 flex flex-wrap justify-center gap-3">
        <a
          href="/dashboard"
          className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-brand-700"
        >
          Try it out →
        </a>
        <a
          href="/demo"
          className="rounded-xl border border-emerald-300 bg-emerald-50 px-6 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
        >
          ▶ See demo
        </a>
        <a
          href="#how"
          className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          How it works ↓
        </a>
      </div>

      <div className="relative mt-10 flex flex-wrap justify-center gap-6 text-xs font-medium text-slate-500">
        <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Secured by Auth0</span>
        <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5" /> Real-time AI insights</span>
        <span className="flex items-center gap-1.5"><Leaf className="h-3.5 w-3.5" /> CO₂ tracked per transaction</span>
        <span className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> Works with AU transaction exports</span>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <main className="bg-white min-h-screen">
      <TopNav />
      <HeroSection />
      <section id="features" className="scroll-mt-24">
        <LandingExamples />
      </section>

      <section id="how" className="scroll-mt-24 py-20 bg-gradient-to-b from-white to-emerald-50">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-3xl font-extrabold text-slate-900 text-center mb-4">How it works</h2>
          <p className="text-center text-slate-600 mb-12 max-w-xl mx-auto">Three simple steps to understand and reduce your environmental footprint.</p>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl font-black text-emerald-700 shadow-md">1</div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Upload your statement</h3>
              <p className="text-sm text-slate-600">Drop in a bank CSV or PDF. Our AI engine extracts every transaction — no manual entry needed.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl font-black text-emerald-700 shadow-md">2</div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Get your impact score</h3>
              <p className="text-sm text-slate-600">Every purchase is categorised and scored for CO₂, water, and planet impact — powered by real environmental data.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl font-black text-emerald-700 shadow-md">3</div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Act on AI insights</h3>
              <p className="text-sm text-slate-600">Your personal AI agent surfaces patterns, recommends swaps, and tracks your progress week over week.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-24 border-t border-slate-200 py-8 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between px-6">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <a href="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="PlanetLedger Logo" className="h-10 w-10 rounded-full shadow-md" />
              <span className="ml-2 text-lg font-bold text-slate-900 tracking-tight">PlanetLedger</span>
            </a>
          </div>
          <div className="flex gap-6 text-sm text-slate-600 items-center">
            <a href="#features" className="px-2 py-1 rounded transition text-slate-700 hover:text-white hover:bg-brand-600">Features</a>
            <a href="#how" className="px-2 py-1 rounded transition text-slate-700 hover:text-white hover:bg-brand-600">How it works</a>
            <LoginButton />
          </div>
          <div className="text-xs text-slate-400 mt-4 md:mt-0">© {new Date().getFullYear()} PlanetLedger. All rights reserved.</div>
        </div>
      </footer>
    </main>
  );
}

*This is a submission for [Weekend Challenge: Earth Day Edition](https://dev.to/challenges/weekend-2026-04-16)*

## What I Built

**PlanetLedger** — an AI-powered sustainability finance dashboard that turns your bank statements into environmental intelligence.

You upload a CSV or PDF bank statement, and an agent pipeline automatically:

- Parses every transaction and categorises it against 20+ real Australian vendors (Woolworths, Chemist Warehouse, Didi, City Chic, Skechers, Aldi, IGA and more)
- Assigns a **planet impact score** (GREEN / YELLOW / RED) per transaction based on category and spend size
- Aggregates spend into a **category breakdown** — Fast Fashion, Grocery, Transport, Electronics, Hygiene, Food Delivery
- Runs a **RAG-grounded insight pipeline** that generates personalised recommendations using your actual spending context
- Shows a **gamified Planet Impact Score** dial (0–100) with unlockable badges (Conscious Spender → Low Impact Week → Planet Saver)
- Lets you chat with your personal agent ("Why is my impact high? What should I cut?")
- Runs a **What-If Simulator** — drag a slider and instantly see how cutting food delivery by 30% changes your score
- Tracks a **memory timeline** so the agent learns your patterns week over week
- Has a public **/demo page** — no login required, try it with sample AU data before signing up
- The sample data is Australian, but **any CSV using the `Date / Transaction / Debit / Credit / Balance` schema works** — regardless of which bank or country it comes from

The goal: make the invisible environmental cost of everyday spending visible and actionable — in seconds, not spreadsheets.

---

## Demo

👉 [Try the live demo — no login needed](https://planet-ledger.vercel.app/demo)

Or sign in to upload your own AU bank statement (CSV or PDF) and get a personalised dashboard.

---

## Code

{% embed https://github.com/ujjavala/PlanetLedger %}

---

## How I Built It

### Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15.5 App Router + TypeScript |
| Auth | **Auth0 v4** (`@auth0/nextjs-auth0`) — middleware-based, zero route handlers |
| AI / LLM | LangChain + OpenAI `gpt-4o-mini` (primary) / Google Gemini `gemini-1.5-flash` (fallback) |
| Rules engine | Custom categorisation + scoring — deterministic, explainable, free |
| RAG layer | Context builder that grounds prompts in real spend data |
| PDF parsing | `pdf-parse` v2 + AU bank statement regex extractor |
| CSV parsing | `papaparse` + AU format (`Date / Transaction / Debit / Credit / Balance`) |
| Event bus | **OpenClaw** — homegrown event-driven workflow runner |
| Styling | Tailwind CSS v3, Space Grotesk font |
| Deployment | Vercel |

---

### The Agent Pipeline

Five layers run in sequence every time you upload:

**1. Parse**
The CSV/PDF parser extracts raw rows into a typed `Transaction[]`. For PDFs, a regex pass converts raw AU bank text (dates like `03 Dec 2022`, amounts, CR/DR markers) into the same CSV format before parsing.

**2. Categorise**
`resolveCategory()` maps merchant names to one of seven categories using regex + keyword matching against known AU vendors. Anything it can't match falls through to an LLM reclassification call (OpenAI or Gemini, temperature=0, 10 tokens max — cheap and fast).

**3. Score**
`calculateImpactScore()` runs the scoring engine:
- GREEN transaction → +10 pts, YELLOW → +5 pts, RED → -2 pts
- Normalised to 0–100 across transaction count
- Preference bonuses: `+8` if user owns no car, `+3` for low-income mode on RED transactions
- Weekly trend: ≥75 = "Improving", 45–74 = "Stable", <45 = "Needs Attention"

**4. Build RAG Context**
Before any insight or chat response, `buildRagContext()` pulls together: last 7 days of transactions, top 2 categories by spend, top 3 merchants, and detected behaviour patterns. This context is injected into every prompt so the agent actually talks about *your* data.

**5. Generate Insights**
The insight pipeline fires `{ type: WARNING | POSITIVE | NEUTRAL, message }` structured outputs and stores them with a 3-minute cache. Patterns like "3+ food delivery orders in a week" or "fast fashion spend > $50" trigger specific recommendations.

Agent memory persists per-user (keyed by Auth0 `sub`) and feeds back into the next run — so the agent gets smarter about your habits over time.

---

### Auth0 for Agents

Auth0 v4 runs entirely via Next.js middleware — no `/api/auth/*` route files needed. One line sets it up:

```ts
// lib/auth0.ts
import { Auth0Client } from "@auth0/nextjs-auth0/server";
export const auth0 = new Auth0Client();

// middleware.ts
export async function middleware(request: NextRequest) {
  return auth0.middleware(request);
}
```

Every API route checks an internal agent scope before doing anything. The scope check is now backed by a **fine-grained authorisation (FGA)** rule table (`lib/auth/fga.ts`) that maps `resource + action → required scope`:

```ts
// lib/auth/fga.ts
export function canPerform(scopes: string[], resource: FGAResource, action: FGAAction): boolean {
  const required = FGA_RULES[resource]?.[action];
  return required ? scopes.includes(required) : false;
}
```

The scopes (`read:transactions`, `write:insights`, `update:score`) live as custom Auth0 claims — not OIDC scopes — which keeps agent permissions cleanly separated from OAuth. User preferences (`noCarOwnership`, `lowIncomeMode`) are stored as Auth0 custom claims so they survive across sessions.

A **Post-Login Action** (`lib/auth/actions/post-login.js`) provisions new users on first login — setting `eco_tier: "starter"` in `app_metadata`, injecting custom claims, and enforcing MFA via `api.multifactor.enable("any")`. Rolling sessions (`inactivityDuration: 1 day`, `absoluteDuration: 7 days`) keep users signed in without requiring frequent re-auth.

The public `/demo` page and `/api/upload/preview` are excluded from the middleware matcher, so anyone can try the app without an account.

---

### OpenClaw — the Event Bus

OpenClaw is a lightweight in-process event system I built to wire up automation without reaching for a queue service.

Four workflows register on startup:

| Workflow | Event | What it does |
|---|---|---|
| `autoInsightOnUpload` | `transactions_uploaded` | Runs the full agent pipeline, caches insights |
| `highImpactAlert` | `high_impact_detected` | Pushes in-app alert notification with top offending categories |
| `weeklyReport` | `weekly_report` | Full score + insights digest; pushes weekly notification to the bell |
| `scoreImprovedCelebration` | `score_improved` | Pushes a celebration notification when the score rises after upload |

After an upload, `openClawChainedTrigger()` fires the full sequence: `transactions_uploaded → score_calculated → insights_generated → score_improved` (if the score increased). The route handler just returns the parsed data immediately while the pipeline runs.

Vercel Cron fires `weekly_report` every Monday at 09:00 UTC via `POST /api/cron/weekly-report`, configured in `vercel.json`.

---

### The /demo Page

One of the things I'm happiest about: the `/demo` page works with zero auth and zero network calls. It's a Next.js server component that imports the sample CSV data as a TypeScript string constant and calls `parseTransactionsCsv()` + `calculateImpactScore()` directly at build time. It prebuilds as a **static page** — instant load, no middleware, no DB.

Premium features (AI chat, What-If Simulator, Memory Timeline) show as blurred locked panels with a lock icon — so visitors can see what they'd get after signing up.

---

### Earth Day Design Choices

- Deep forest green hero gradient — earth tones throughout, nothing corporate-blue
- Category breakdown with proportional spend bars instead of raw numbers
- Impact score dial animates from red → amber → green when the page loads
- Real AU vendor recognition — the shops people in Australia actually use
- Every transaction shows its impact colour inline so the pattern is visible at a glance

---

### Interesting Engineering Decisions

**Why deterministic rules for categorisation, not LLM?**
Rules are fast, free, and traceable. Every categorisation decision has an exact rule you can point to. I use the LLM only for the `"Other"` fallback bucket — maybe 10–15% of transactions — where a keyword match doesn't exist. That keeps costs near zero and lets the rules engine run at build time on the demo page.

**Why an in-memory store?**
For a weekend build, an in-memory `Map<userId, UserMemory>` is zero-infrastructure and good enough for single-server dev. Both stores are now anchored to `globalThis.__pl_*` keys so HMR hot reloads in dev don't wipe your data. The entire storage layer is behind a `lib/store.ts` interface — swapping to Redis or Postgres is one function replacement, not an architectural change.

Agent memory specifically uses a **file-backed store** (`.agent-memory/<fnv1a-hash>.json`) with 30-day auto-expiry — so the agent's learned patterns survive server restarts, not just hot reloads.

**Why AU sample data, and can other countries use it?**
The sample data is from an Australian bank (ANZ/CBA-style export), but the parser isn't locked to Australia. Any CSV that follows the `Date / Transaction / Debit / Credit / Balance` column schema will parse correctly — regardless of the bank or country. The vendor categorisation rules are AU-focused right now (Woolworths, Chemist Warehouse, Didi, etc.), but the categorisation layer is just a map — adding UK, US, or EU merchants is additive. The "Why AU only" answer is really: nailing one set of vendors well beats vague coverage of five markets.

---

## Going Further During the Weekend

The core build came together fast, so I kept pushing. Here's what landed after the initial submission:

**Real multi-turn chat with what-if and doc Q&A**
The chat engine was keyword-matching and templated. It's now a real multi-turn conversation — conversation history is injected as context so the agent remembers what you asked. You can ask "what if I reduce food delivery by 30%?" and the agent runs an actual score simulation. You can ask "how much did I spend on groceries last week?" and it queries your real transaction data. The RAG scaffolding was already there; wiring it up to GPT-4o was the last step.

**File-backed persistent agent memory**
Agent memory moved from an in-memory `Map` (lost on restart) to per-user `.agent-memory/<fnv1a-hash>.json` files with 30-day auto-expiry. In dev they live at `.agent-memory/`, in prod at `/tmp/planetledger-memory/`. The agent's learned patterns now actually survive hotfixes and deploys.

**In-app notification bell**
OpenClaw's `highImpactAlert` and `weeklyReport` were logging to console. Now they push structured notifications to an in-memory store, which a bell component polls every 60 seconds. Three notification types: 📊 Weekly Report, 🌱 Score Improved, ⚠️ High-Impact Alert. The `score_improved` event is new too — fires automatically when an upload raises your score.

**Chained OpenClaw pipeline + Vercel Cron**
The upload flow now fires a full event chain: `transactions_uploaded → score_calculated → insights_generated → score_improved`. One call, four events, all in-process. The weekly report fires via Vercel Cron every Monday 09:00 UTC (`vercel.json` + `/api/cron/weekly-report`).

**Auth0 FGA, Post-Login Action, MFA, rolling sessions**
The flat scope check got replaced with a proper FGA rule table (`resource + action → required scope`). A Post-Login Action provisions new users on first login and enforces MFA. Rolling sessions mean users stay signed in across the week without re-authing.

**Privacy hardening**
`email` and merchant names are no longer stored in `UserContext`, agent memory, or RAG prompts — they're PII-adjacent and don't need to be there. OpenClaw workflow logs pseudonymize user IDs via FNV-1a hash (`usr_XXXXXXXX`). A `lib/privacy/sanitizer.ts` module handles all redaction.

---

## What's Still Next

**Persistent database**
The transaction store is still in-memory (`Map<userId, UserMemory>` anchored to `globalThis` for HMR safety). Agent memory is file-backed now, but transactions, scores, and chat history need Postgres via Prisma for real persistence. The store interface is already abstracted — the migration is mostly additive.

**Smart parsing for all countries**
The AU bank format is very specific. The next version should detect the bank format automatically — US (Plaid/OFX), UK (Monzo/Starling CSV), EU (SEPA), and AU — and route to the right parser.

**Real CO₂ data**
Right now impact scores are proxy-based (category + spend → colour). The right approach is to integrate an actual emissions API (like Climatiq or Patch) to get grams of CO₂e per transaction category, so the score means something measurable.

**Email / push delivery**
In-app notifications work. Email or mobile push (Resend, FCM) would make the weekly report actually reach users where they are.

**Mobile-friendly upload**
The upload panel works on desktop. A mobile-optimised flow — forwarding a bank statement email directly to PlanetLedger via a Cloudflare Email Worker — would massively reduce friction.

**More AI agent capabilities**
- Goal setting ("I want to reduce fast fashion spend by 40% this month") with progress tracking
- Carbon offset suggestions matched to your worst categories
- Peer comparison ("people with similar spending reduced food delivery by X%")- Surface proactive nudges (WARNING / TIP / CELEBRATION) from `lib/agent/nudges.ts` — the engine is built, just needs an API route + UI hook

---

## Prize Categories

- **Best Use of Auth0 for Agents** — Auth0 v4 middleware with zero route handlers; FGA rule table (`resource + action → scope`) backing every agent action; Post-Login Action provisioning with MFA enforcement; rolling sessions (`inactivityDuration` + `absoluteDuration`); custom claims for preferences, eco_tier, and organization_id; scope check on every API route before any agent action runs.

- **Best Use of GitHub Copilot** — Used end-to-end: scaffolding the agent pipeline, writing AU vendor categorisation rules, building the PDF regex extractor, generating type-safe API routes, implementing the FGA rule table and privacy sanitizer, designing the notification bell + polling architecture, building the chained OpenClaw pipeline, and iterating on UI components throughout.

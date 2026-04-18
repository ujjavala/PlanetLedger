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

Every API route checks an internal agent scope before doing anything:

```ts
export async function authorizeAgentScope(requiredScope: AgentScope) {
  const session = await auth0.getSession();
  const userContext = resolveUserContext(session?.user);
  if (!hasRequiredScope(userContext.scopes, requiredScope)) {
    return { ok: false, response: NextResponse.json({ error: `Agent scope missing: ${requiredScope}` }, { status: 403 }) };
  }
  return { ok: true, context: userContext };
}
```

The scopes (`read:transactions`, `write:insights`, `update:score`) live as custom Auth0 claims — not OIDC scopes — which keeps agent permissions cleanly separated from OAuth. User preferences (`noCarOwnership`, `lowIncomeMode`) and the agent memory summary are also stored as Auth0 custom claims so they survive across sessions.

The public `/demo` page and `/api/upload/preview` are excluded from the middleware matcher, so anyone can try the app without an account.

---

### OpenClaw — the Event Bus

OpenClaw is a lightweight in-process event system I built to wire up automation without reaching for a queue service.

Three workflows register on startup:

| Workflow | Trigger | What it does |
|---|---|---|
| `autoInsightOnUpload` | Every CSV/PDF upload | Runs the full agent pipeline, caches insights |
| `highImpactAlert` | Score drops below 40/100 | Logs a structured alert with the top offending categories |
| `weeklyReport` | Manual / scheduled | Full score + insights + spend breakdown digest |

After an upload, the API handler fires `transactions_uploaded` and OpenClaw takes care of the rest — the route handler just returns the parsed data immediately while the pipeline runs.

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
For a weekend build, an in-memory `Map<userId, UserMemory>` is zero-infrastructure and good enough for single-server dev. The entire storage layer is behind a `lib/store.ts` interface — swapping to Redis or Postgres is one function replacement, not an architectural change.

**Why AU sample data, and can other countries use it?**
The sample data is from an Australian bank (ANZ/CBA-style export), but the parser isn't locked to Australia. Any CSV that follows the `Date / Transaction / Debit / Credit / Balance` column schema will parse correctly — regardless of the bank or country. The vendor categorisation rules are AU-focused right now (Woolworths, Chemist Warehouse, Didi, etc.), but the categorisation layer is just a map — adding UK, US, or EU merchants is additive. The "Why AU only" answer is really: nailing one set of vendors well beats vague coverage of five markets.

---

## What's Next

This was a weekend build, so there's a lot of "it works but could be better." Here's the roadmap I'm thinking about:

**Real LLM for chat and insights**
Right now the chat engine is keyword-matching with templated responses. The scaffolding is already there (RAG context builder, prompt grounding) — connecting it to GPT-4o or Gemini for real conversational replies is the highest-value next step.

**Persistent database**
The in-memory store is the biggest production blocker. The plan is Postgres via Prisma — transactions, scores, chat history, and memory timeline all need to survive server restarts. The store interface is already abstracted so the migration is mostly additive.

**Smart parsing for all countries**
The AU bank format is very specific. The next version should detect the bank format automatically — US (Plaid/OFX), UK (Monzo/Starling CSV), EU (SEPA), and AU — and route to the right parser. Longer term, LLM-based "fuzzy CSV parsing" could handle any format without needing a custom regex per bank.

**Real CO₂ data**
Right now impact scores are proxy-based (category + spend → colour). The right approach is to integrate an actual emissions API (like Climatiq or Patch) to get grams of CO₂e per transaction category, so the score means something measurable.

**Email / push notifications**
OpenClaw's `highImpactAlert` workflow already fires structured events — it's just logging to console right now. Hooking it up to Resend or a push service would make the alerts actually reach users.

**Mobile-friendly upload**
The upload panel works on desktop. Adding a mobile-optimised flow where you can forward a bank statement email directly to PlanetLedger (via a Cloudflare Email Worker or similar) would massively reduce friction.

**More AI agent capabilities**
- Goal setting ("I want to reduce fast fashion spend by 40% this month") with progress tracking
- Carbon offset suggestions matched to your worst categories
- Peer comparison ("people with similar spending reduced food delivery by X%")

---

## Prize Categories

- **Best Use of Auth0 for Agents** — Auth0 v4 middleware with zero route handlers, per-user agent scopes as custom claims, session-scoped agent memory keyed by Auth0 `sub`, server-side session retrieval throughout the Next.js App Router, scope check on every API route before any agent action runs.

- **Best Use of GitHub Copilot** — Used end-to-end: scaffolding the agent pipeline, writing AU vendor categorisation rules, building the PDF regex extractor, generating type-safe API routes, iterating on UI components, and debugging type mismatches between the two `Transaction` shapes the codebase had to reconcile.

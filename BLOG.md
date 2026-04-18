*This is a submission for [Weekend Challenge: Earth Day Edition](https://dev.to/challenges/weekend-2026-04-16)*

## What I Built

**PlanetLedger** — an AI-powered sustainability finance dashboard that turns your bank statements into environmental intelligence.

You upload a CSV or PDF bank statement, and an agent pipeline automatically:

- Extracts and categorises every transaction against 20+ real Australian vendors (Woolworths, Chemist Warehouse, Didi, City Chic, Skechers etc.)
- Assigns a **CO₂/planet impact score** (GREEN / YELLOW / RED) per transaction based on category and spend size
- Aggregates spend into a **category breakdown** (Fast Fashion, Grocery, Transport, Electronics, Hygiene, Food Delivery)
- Surfaces **AI-generated insights and recommendations** via a personal agent with memory
- Shows a **gamified Planet Impact Score** dial (0–100) with unlockable badges (Conscious Spender → Low Impact Week → Planet Saver)
- Lets you ask your agent questions ("Why is my impact high? How can I reduce it?") via a chat panel
- Runs a **What-If Simulator** ("What if I cut food delivery by 30%?")

The goal: make the invisible environmental cost of everyday spending visible and actionable — in seconds, not spreadsheets.

---

## Demo

> Upload `sample-transactions.csv` → click **View stats →** → explore your planet impact dashboard.

_(Deployed link / video to be added)_

---

## Code

{% embed https://github.com/ujjavala/PlanetLedger %}

---

## How I Built It

### Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15.5 App Router + TypeScript |
| Auth | **Auth0 v4** (`@auth0/nextjs-auth0`) — middleware-based |
| AI Pipeline | Custom rule + pattern engine with agent memory and context extraction |
| PDF parsing | `pdf-parse` + regex-based AU bank statement extractor |
| CSV parsing | `papaparse` + AU bank format (Date / Transaction / Debit / Credit / Balance) |
| Styling | Tailwind CSS v3, Space Grotesk font |
| Deployment | Vercel |

---

### The Agent Architecture

The pipeline has four layers:

**1. Categorisation**
`resolveCategory()` maps raw merchant names to categories using regex/keyword matching against 20+ AU vendors. `resolveImpactColor()` converts category + spend amount into GREEN / YELLOW / RED.

**2. Rule Engine**
Deterministic rules fire on categories — e.g. Fast Fashion spend > $50 → RED alert, 3+ food delivery purchases in a week → pattern detected.

**3. Pattern Engine**
Identifies behavioural trends across transactions: high-frequency delivery orders, recurring fast fashion, hygiene product bulk buys, etc.

**4. Insight Generator**
Produces structured `{ type: WARNING | POSITIVE | NEUTRAL, message }` insights with personalised recommendations based on the detected patterns.

Agent memory persists per-user (keyed by Auth0 `sub`) and feeds back into the next pipeline run, so insights improve over time.

---

### Auth0 for Agents

Auth0 v4 runs entirely via middleware — no route handlers needed. The `Auth0Client` checks session on every request. The dashboard page server-renders the user's email and passes it to the shell component.

Internal agent scopes (`read:transactions`, `write:insights`, `update:score`) are resolved from the user context — not the OIDC token — keeping agent permissions cleanly decoupled from OAuth scopes.

```ts
// lib/auth0.ts
import { Auth0Client } from "@auth0/nextjs-auth0/server";
export const auth0 = new Auth0Client();

// middleware.ts
import { auth0 } from "./lib/auth0";
export async function middleware(request: NextRequest) {
  return auth0.middleware(request);
}
```

The agent authorization layer checks scopes before every API route:

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

---

### OpenClaw Automation

Three automated workflows trigger on events:

| Workflow | Trigger | What it does |
|---|---|---|
| `autoInsightOnUpload` | After every CSV/PDF upload | Runs the full agent pipeline, caches insights |
| `highImpactAlert` | Impact score drops below threshold | Fires a structured alert with top offending categories |
| `weeklyReport` | Scheduled / manual | Full score + insights + spend breakdown digest |

---

### Earth Day Design Choices

- Deep forest green hero gradient on the dashboard — earth tones throughout
- Category breakdown with spend bars instead of raw transaction rows
- Impact score dial: red → amber → green with smooth SVG animation
- Real AU vendor recognition — the merchants people in Australia actually spend at
- Trust signals front and centre: Auth0 security badge, CO₂ tracked per transaction

---

### Interesting Decisions

**Why not use a real LLM for categorisation?**
Deterministic rules are fast, free, and explainable. Every categorisation decision can be traced to a rule. LLMs are used for the conversational chat layer where nuance matters, not for structured classification where consistency matters.

**Why in-memory store?**
For a hackathon, an in-memory store keyed by `Auth0 sub` is zero-infrastructure and perfectly correct for single-server dev. Swapping to Redis or Postgres is a single function replacement in `lib/store.ts`.

**Why AU bank statement format?**
Most finance apps are built for US/UK formats. AU banks (ANZ, CBA, NAB, Westpac) export `Date / Transaction / Debit / Credit / Balance` CSV format — so we built the parser specifically for that, making it immediately useful for Australian users.

---

## Prize Categories

- **Best Use of Auth0 for Agents** — Auth0 v4 middleware, per-user agent scopes, session-scoped agent memory keyed by Auth0 `sub`, server-side session retrieval in Next.js App Router, agent authorization checked on every API route.

- **Best Use of GitHub Copilot** — Used throughout the build: agent pipeline scaffolding, AU vendor categorisation rules, PDF regex extractor, type-safe API route generation, UI component iteration, and debugging type mismatches between the two Transaction type systems.

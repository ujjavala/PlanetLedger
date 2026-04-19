# PlanetLedger

PlanetLedger is an agent-first sustainability finance dashboard that turns bank statements into environmental intelligence. Upload a CSV or PDF and get a personalised impact score, AI-powered insights, and adaptive recommendations — powered by an in-process event pipeline, Auth0 with FGA, and a persistent agent memory system.

Flow: `User → Auth0 → PlanetLedger Agent → OpenClaw Pipeline → Insights + Notifications → UI`

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15.5 App Router + TypeScript |
| Auth | **Auth0 v4** (`@auth0/nextjs-auth0`) — middleware-based, zero route handlers |
| AI / LLM | LangChain + OpenAI `gpt-4o-mini` / Google Gemini `gemini-1.5-flash` (fallback) |
| Rules engine | Custom categorisation + scoring — deterministic, explainable |
| RAG | Context builder that grounds prompts in real spend data |
| PDF parsing | `pdf-parse` v2 + AU bank statement regex extractor |
| Event bus | **OpenClaw** — homegrown in-process event-driven workflow runner |
| Cron | Vercel Cron (`vercel.json`) — weekly report every Monday 09:00 UTC |
| Styling | Tailwind CSS, Space Grotesk font |
| Deployment | Vercel |

## Auth0 Responsibilities

- Authentication via Next.js middleware — zero route files needed
- **Rolling sessions** — `inactivityDuration: 1 day`, `absoluteDuration: 7 days`
- **MFA enforcement** via `acr_values: "http://schemas.openid.net/pape/policies/2007/06/multi-factor"`
- **Organisations** — `organizationId` on `UserContext`, injected via Post-Login Action
- **Fine-grained authorisation (FGA)** — `lib/auth/fga.ts` maps `resource + action → required scope`
- Scope-based agent permissions:
  - `read:transactions` — view parsed transactions
  - `write:insights` — generate and cache AI insights
  - `update:score` — recalculate impact score
- **Post-Login Action** (`lib/auth/actions/post-login.js`) — provisions new users with `eco_tier: "starter"`, injects custom claims (`preferences`, `scopes`, `eco_tier`, `organization_id`). Deploy in Auth0 Dashboard → Actions → Library → Build Custom → Login flow.

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/upload` | Required | Upload CSV or PDF bank statement |
| `GET` | `/api/transactions` | Required | Return parsed transactions |
| `GET` | `/api/score` | Required | Return impact score summary |
| `GET` | `/api/agent-insights` | Required | Return personalised insights |
| `POST` | `/api/agent-chat` | Required | Multi-turn agent chat with what-if and doc Q&A |
| `GET` | `/api/notifications` | Required | Return in-app notifications |
| `POST` | `/api/notifications` | Required | Mark notifications as read |
| `POST` | `/api/simulate` | Required | What-if simulation endpoint |
| `POST` | `/api/upload/preview` | Public | Preview parse without auth |
| `POST` | `/api/cron/weekly-report` | Cron secret | Vercel Cron — fires weekly reporting event |

## Agent Logic

**Impact score categories:**

| Category | Colour | Points |
|---|---|---|
| Grocery | GREEN | +10 |
| Transport (public / walk) | GREEN | +10 |
| Fast Fashion | RED | -2 |
| Hygiene Products | RED | -2 |
| Food Delivery | YELLOW | +5 |
| Electronics | YELLOW | +5 |

Normalised to 0–100 across transaction count. Preference bonuses: `+8` if user owns no car, `+3` for low-income mode on RED transactions.

**Agent capabilities:**

- **Persistent file-backed memory** — per-user `.agent-memory/<hash>.json`, 30-day auto-expiry, survives server restarts
- **Proactive nudges** — `lib/agent/nudges.ts` generates WARNING / TIP / CELEBRATION nudges from transaction patterns
- **Multi-turn chat** — conversation history injected as context so the agent remembers what you asked
- **What-if via chat** — natural language ("what if I reduce food delivery by 30%") triggers score simulation
- **Document Q&A** — spend queries ("how much did I spend on groceries?") answered from transaction data

## OpenClaw — Event Pipeline

Four workflows register on startup:

| Event | Workflow | What it does |
|---|---|---|
| `transactions_uploaded` | `autoInsightOnUpload` | Runs full agent pipeline, caches insights |
| `score_improved` | `scoreImprovedCelebration` | Pushes in-app notification when score rises |
| `high_impact_detected` | `highImpactAlert` | Pushes alert notification; logs top offending categories |
| `weekly_report` | `weeklyReport` | Full score + insights digest; pushes weekly notification |

Upload triggers the chained pipeline via `openClawChainedTrigger()` — a single call fires `transactions_uploaded → score_calculated → insights_generated → score_improved` (if score increased).

Vercel Cron fires `weekly_report` every Monday at 09:00 UTC via `POST /api/cron/weekly-report`.

## Notifications

The dashboard notification bell (`components/notification-bell.tsx`) polls `/api/notifications` every 60 seconds. Three event types feed the bell:

- 📊 **Weekly Report** — Monday morning summary
- 🌱 **Score Improved** — when score increases after an upload
- ⚠️ **High-Impact Alert** — when high-impact transactions are detected

## Privacy

- `email` and merchant names are intentionally **not stored** in `UserContext`, agent memory, or RAG prompts
- `lib/privacy/sanitizer.ts` provides `sanitizeForLog()` (redacts PII keys) and `pseudonymize()` (FNV-1a hash → `usr_XXXXXXXX`) for structured logs
- All OpenClaw workflow logs use pseudonymized user IDs

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Configure env:

```bash
cp .env.example .env.local
```

3. Fill in `.env.local`:

```bash
AUTH0_SECRET=           # random 32-byte string
AUTH0_BASE_URL=         # http://localhost:3000
AUTH0_ISSUER_BASE_URL=  # https://YOUR_DOMAIN.auth0.com
AUTH0_CLIENT_ID=        # Auth0 app client ID
AUTH0_CLIENT_SECRET=    # Auth0 app client secret
OPENAI_API_KEY=         # optional: LLM chat + insights
GOOGLE_AI_API_KEY=      # optional: Gemini fallback
CRON_SECRET=            # secret for /api/cron routes
CRON_USER_IDS=          # comma-separated user IDs for weekly cron
```

4. Run dev server:

```bash
npm run dev
```

5. Open: `http://localhost:3000`

## Notes

- In-memory store uses `globalThis` anchoring for HMR safety in dev (`__pl_userMemoryStore`, `__pl_notificationStore`).
- Agent memory is file-backed (`.agent-memory/` in dev, `/tmp/planetledger-memory/` in prod) — survives hot reloads and server restarts.
- The public `/demo` page and `/api/upload/preview` require no auth — anyone can try the app.
- No external banking APIs are used.

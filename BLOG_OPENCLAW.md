*This is a submission for the [OpenClaw Challenge](https://dev.to/challenges/openclaw-2026-04-16).*

## What I Built

**PlanetLedger** is a sustainability finance dashboard that turns your bank statements into environmental intelligence. You upload a CSV or PDF statement, and the app automatically categorises every transaction, calculates a planet impact score, and fires off a chain of automated workflows — all powered by an event bus I called **OpenClaw**.

The idea is simple: most people have no idea whether their everyday spending is environmentally terrible or not. PlanetLedger makes that visible in 10 seconds, without a spreadsheet.

👉 [Live demo — no login required](https://planet-ledger.vercel.app/demo)

{% embed https://github.com/ujjavala/PlanetLedger %}

---

## How I Used OpenClaw

OpenClaw is the event-driven automation layer I built into PlanetLedger. It's intentionally lightweight — no external queue, no infrastructure, just a typed event bus that decouples "something happened" from "here's what to do about it."

### The Core Design

The whole thing is about 60 lines across four files:

```
lib/openclaw/
  types.ts      ← event + trigger types
  registry.ts   ← register triggers, fire events
  trigger.ts    ← called from API routes
  workflows.ts  ← the actual automation logic
```

**Types** — everything is typed so workflows know exactly what data they get:

```ts
export type OpenClawEventType =
  | "transactions_uploaded"
  | "score_calculated"
  | "insights_generated"
  | "score_improved"
  | "weekly_report"
  | "high_impact_detected"
  | "behavioral_pattern_detected"
  | "custom";

export interface OpenClawEvent {
  type: OpenClawEventType;
  userId: string;
  payload?: any;
  timestamp?: string;
}

export type OpenClawTrigger = (event: OpenClawEvent) => Promise<void>;
```

**Registry** — a simple map of event types to arrays of trigger functions:

```ts
const triggers: Record<string, OpenClawTrigger[]> = {};

export function registerOpenClawTrigger(eventType: string, trigger: OpenClawTrigger) {
  if (!triggers[eventType]) triggers[eventType] = [];
  triggers[eventType].push(trigger);
}

export async function fireOpenClawEvent(event: OpenClawEvent) {
  const list = triggers[event.type] || [];
  for (const trigger of list) {
    await trigger(event);
  }
}
```

**Registration** happens at module load time — the registry file imports and wires up all four workflows:

```ts
registerOpenClawTrigger("transactions_uploaded", autoInsightOnUpload);
registerOpenClawTrigger("transactions_uploaded", highImpactAlert);
registerOpenClawTrigger("weekly_report", weeklyReport);
registerOpenClawTrigger("score_improved", scoreImprovedCelebration);
```

**Firing events** from an API route is now one call that chains the whole pipeline:

```ts
// app/api/upload/route.ts — after parsing + storing transactions:
await openClawChainedTrigger(session.user, previousScore);
```

`openClawChainedTrigger` fires four events in sequence: `transactions_uploaded → score_calculated → insights_generated → score_improved` (only if the score actually increased). The upload route returns the parsed data to the client immediately — the whole chain runs after the response is already on its way.

---

### The Four Workflows

**Workflow 1 — `autoInsightOnUpload`**

Fires on every `transactions_uploaded` event. It fetches the just-stored transactions, runs `buildRagContext()` to pull together the most relevant spend signals (top categories by spend, top merchants, recent patterns), then calls `buildAgentInsights()` to generate personalised recommendations. The result gets cached so the insights panel loads instantly when the user navigates to the dashboard.

```ts
export async function autoInsightOnUpload(event: OpenClawEvent) {
  const transactions = getTransactions(event.userId);
  const score = getScore(event.userId);
  if (!transactions.length || !score) return;

  const ragContext = buildRagContext(transactions, score);
  const insights = buildAgentInsights(
    transactions,
    event.payload?.userContext,
    score,
    ragContext
  );
  setCachedInsights(event.userId, insights);
}
```

The RAG context builder is what makes this interesting — instead of sending all transactions to the insight engine, it distills them into the most useful signals first:
- Last 7 days of transactions (or all if none in the last week)
- Top 2 categories by total spend
- Detected behavioural patterns (e.g. "3+ food delivery orders this week")

Merchant names are intentionally excluded from the RAG context — they're PII-adjacent and the insight engine doesn't need them to produce useful recommendations.

This grounding is what makes the insights feel specific rather than generic.

---

**Workflow 2 — `highImpactAlert`**

Also fires on `transactions_uploaded`. It checks if the impact score is low and, if so, pushes a structured notification directly to the user's in-app notification bell:

```ts
export async function highImpactAlert(event: OpenClawEvent) {
  const score = getScore(pseudonymize(event.userId));
  if (!score) return;

  if (score.impactScore < 40) {
    pushNotification(event.userId, {
      type: "high_impact",
      title: "High-Impact Alert",
      body: `${score.highImpactCount} high-impact transactions detected this week (score: ${score.impactScore}/100).`,
    });
  }
}
```

The notification lands in the dashboard bell immediately — no email, no external service, no infrastructure. `pseudonymize()` wraps the userId in an FNV-1a hash (`usr_XXXXXXXX`) before it touches any log or store, so PII never leaks into structured outputs.

---

**Workflow 3 — `weeklyReport`**

Fires on `weekly_report` events, triggered by Vercel Cron every Monday at 09:00 UTC via `POST /api/cron/weekly-report`. It generates a full digest and pushes it to the notification bell:

```ts
export async function weeklyReport(event: OpenClawEvent) {
  const transactions = getTransactions(event.userId);
  const score = getScore(event.userId);
  const insights = getCachedInsights(event.userId) ?? buildAgentInsights(...);

  pushNotification(event.userId, {
    type: "weekly_report",
    title: "Weekly Report",
    body: `Score: ${score.impactScore}/100 · Spend: $${totalSpend.toFixed(0)} · Trend: ${score.weeklyTrend}`,
  });
}
```

The `vercel.json` cron config:

```json
{ "crons": [{ "path": "/api/cron/weekly-report", "schedule": "0 9 * * 1" }] }
```

The endpoint validates a `Bearer CRON_SECRET` header, iterates over `CRON_USER_IDS` from env, and fires a `weekly_report` event per user.

---

**Workflow 4 — `scoreImprovedCelebration`**

Fires on the `score_improved` event, which `openClawChainedTrigger` emits when the new score is higher than the score before the upload. It pushes a celebration notification:

```ts
export async function scoreImprovedCelebration(event: OpenClawEvent) {
  pushNotification(event.userId, {
    type: "score_improved",
    title: "Score Improved 🌱",
    body: `Your eco score improved to ${event.payload?.newScore}/100 — great progress!`,
  });
}
```

This is the workflow that closes the feedback loop. Upload → pipeline runs → score improves → bell lights up. All in-process, no round trips.

---

### Multiple Workflows on the Same Event + Chained Pipeline

One of the things I like about the registry approach: you can register multiple triggers for the same event type and they all fire sequentially. Both `autoInsightOnUpload` and `highImpactAlert` fire on `transactions_uploaded`:

```ts
registerOpenClawTrigger("transactions_uploaded", autoInsightOnUpload);
registerOpenClawTrigger("transactions_uploaded", highImpactAlert);
```

Adding `scoreImprovedCelebration` on `score_improved` was one more `registerOpenClawTrigger` call. Zero changes to upload logic, zero changes to existing workflows.

The chained pipeline takes this further — instead of firing one event and hoping downstream workflows pick it up, `openClawChainedTrigger` fires a deliberate sequence:

```
transactions_uploaded
  → score_calculated   (stores the new score)
  → insights_generated (triggers autoInsightOnUpload)
  → score_improved     (only if score increased — triggers celebration)
```

Each step in the chain passes context forward via `payload`, so later workflows know exactly what the previous step produced. It's a lightweight saga pattern without any infrastructure.

---

## Demo

👉 **[planet-ledger.vercel.app](https://planet-ledger.vercel.app)** — sign in to upload your own AU bank statement

👉 **[planet-ledger.vercel.app/demo](https://planet-ledger.vercel.app/demo)** — no login needed, try it with sample data right now

The demo page shows the full dashboard — summary cards, transaction table, insights panel, weekly summary, a demo notification feed, and locked previews of the AI chat, What-If Simulator, and Memory Timeline. After sign-in, uploading a statement triggers all four OpenClaw workflows automatically.

{% embed https://github.com/ujjavala/PlanetLedger %}

---

## What I Learned

**Decoupling is worth the extra file.** The upload API route doesn't know anything about insights, alerts, or reports. It parses, stores, fires one chained trigger, and returns. That separation made it much easier to iterate — I could change how insights are generated without touching the upload logic at all.

**Name your events well.** `transactions_uploaded` is clear. `custom` is a trap — you end up using it for everything and lose the ability to filter. Adding `score_calculated`, `insights_generated`, and `score_improved` as first-class event types made the chained pipeline readable and debuggable.

**Structured payloads > strings.** Early versions of the alert workflow just logged a string message. Switching to a structured object with `type`, `userId`, `impactScore`, `highImpactCount`, and `timestamp` — and routing it to `pushNotification()` — made the output immediately usable in the UI with no reformatting.

**Pseudonymize before logging.** Passing raw user IDs into structured logs is a habit that causes problems at scale. Wrapping every `userId` in `pseudonymize()` (FNV-1a → `usr_XXXXXXXX`) before it touches a log or store is a one-line fix that's easier to do from the start than to retrofit later.

**The in-process event bus is underrated for early-stage apps.** It's not RabbitMQ, it doesn't survive server restarts, and you can't replay events. But it gave me the same workflow separation patterns you'd get from a proper queue — at zero infrastructure cost. When it's time to scale, the migration path is clear: replace `fireOpenClawEvent` with an enqueue call and move the workflow functions to workers.

**OpenClaw as an extension point.** The event types I haven't fully wired to UI yet (`behavioral_pattern_detected`) are sitting there ready. Future workflows — goal progress updates, peer benchmarks, proactive nudges — all land in `workflows.ts` with zero changes to application routes.

---

## ClawCon Michigan

I didn't attend ClawCon Michigan this time, but I'd love to next year — especially to talk through event-driven patterns in AI agent systems. A lot of the OpenClaw design decisions (typed events, sequential trigger execution, structured alert payloads) came from thinking about how agent workflows differ from traditional job queues, and that feels like exactly the kind of conversation that would thrive at an in-person event.

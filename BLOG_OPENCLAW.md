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

**Registration** happens at module load time — the registry file imports and wires up the three workflows:

```ts
registerOpenClawTrigger("transactions_uploaded", autoInsightOnUpload);
registerOpenClawTrigger("transactions_uploaded", highImpactAlert);
registerOpenClawTrigger("weekly_report", weeklyReport);
```

**Firing an event** from an API route is one line:

```ts
// app/api/upload/route.ts — after parsing + storing transactions:
await openClawAutoInsightTrigger(session.user);
```

The upload route handler returns the parsed data to the client immediately. OpenClaw workflows run after — the user already has their results while automation quietly does the rest.

---

### The Three Workflows

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
- Top 3 merchants by frequency
- Detected behavioural patterns (e.g. "3+ food delivery orders this week")

This grounding is what makes the insights feel specific rather than generic.

---

**Workflow 2 — `highImpactAlert`**

Also fires on `transactions_uploaded`. It checks if the impact score dropped below 40/100 and, if so, emits a structured alert:

```ts
export async function highImpactAlert(event: OpenClawEvent) {
  const score = getScore(event.userId);
  if (!score) return;

  if (score.impactScore < 40) {
    const alert = {
      type: "HIGH_IMPACT_ALERT",
      userId: event.userId,
      impactScore: score.impactScore,
      highImpactCount: score.highImpactCount,
      weeklyTrend: score.weeklyTrend,
      message: `Your sustainability score dropped to ${score.impactScore}/100 this week with ${score.highImpactCount} high-impact transactions.`,
      timestamp: new Date().toISOString()
    };
    // Production: await sendEmail(event.userId, alert) or await pushNotification(...)
    console.warn("[OpenClaw] High impact alert:", alert);
  }
}
```

Right now it logs to console — in production this would call a Resend email handler or push notification service. The structured payload is already ready for that; the delivery mechanism is the only thing left to plug in.

---

**Workflow 3 — `weeklyReport`**

Fires on `weekly_report` events (manual or scheduled). It generates a full digest — total spend, impact score, trend, top categories, top recommendation, behaviour patterns — and logs it as a structured object:

```ts
const report = {
  type: "WEEKLY_REPORT",
  userId: event.userId,
  week: new Date().toISOString().slice(0, 10),
  totalSpend: totalSpend.toFixed(2),
  impactScore: score?.impactScore ?? 0,
  weeklyTrend: score?.weeklyTrend ?? "No Data",
  highImpactCount: score?.highImpactCount ?? 0,
  topCategories,
  summary: insights.summary,
  topRecommendation: insights.recommendations[0],
  behaviorPatterns: insights.behaviorPatterns
};
```

Again, production delivery (email digest, Slack, push) is one `await` away — the report object is already fully formed.

---

### Multiple Workflows on the Same Event

One of the things I like about the registry approach: you can register multiple triggers for the same event type and they all fire sequentially. Right now both `autoInsightOnUpload` and `highImpactAlert` fire on `transactions_uploaded`:

```ts
registerOpenClawTrigger("transactions_uploaded", autoInsightOnUpload);
registerOpenClawTrigger("transactions_uploaded", highImpactAlert);
```

Adding a third workflow — say, `updateMemoryTimeline` — is one more `registerOpenClawTrigger` call. No changes to the upload route, no changes to existing workflows.

---

## Demo

👉 **[planet-ledger.vercel.app](https://planet-ledger.vercel.app)** — sign in to upload your own AU bank statement

👉 **[planet-ledger.vercel.app/demo](https://planet-ledger.vercel.app/demo)** — no login needed, try it with sample data right now

The demo page shows the full dashboard — summary cards, transaction table, insights panel, and locked previews of the AI chat, What-If Simulator, and Memory Timeline. After sign-in, uploading a statement triggers all three OpenClaw workflows automatically.

{% embed https://github.com/ujjavala/PlanetLedger %}

---

## What I Learned

**Decoupling is worth the extra file.** The upload API route doesn't know anything about insights, alerts, or reports. It parses, stores, fires one event, and returns. That separation made it much easier to iterate — I could change how insights are generated without touching the upload logic at all.

**Name your events well.** `transactions_uploaded` is clear. `custom` is a trap — you end up using it for everything and lose the ability to filter. I'd add `score_recalculated` and `chat_message_sent` as first-class event types if I were doing this again.

**Structured payloads > strings.** Early versions of the alert workflow just logged a string message. Switching to a structured object with `type`, `userId`, `impactScore`, `highImpactCount`, and `timestamp` made the output immediately usable — I could drop in `sendEmail(event.userId, alert)` without reformatting anything.

**The in-process event bus is underrated for early-stage apps.** It's not RabbitMQ, it doesn't survive server restarts, and you can't replay events. But it gave me the same workflow separation patterns you'd get from a proper queue — at zero infrastructure cost. When it's time to scale, the migration path is clear: replace `fireOpenClawEvent` with an enqueue call and move the workflow functions to workers.

**OpenClaw as an extension point.** The event types I haven't used yet (`high_impact_detected`, `behavioral_pattern_detected`) are sitting there ready. Future workflows — daily nudges, goal progress updates, peer benchmarks — all land in `workflows.ts` with zero changes to the application routes.

---

## ClawCon Michigan

I didn't attend ClawCon Michigan this time, but I'd love to next year — especially to talk through event-driven patterns in AI agent systems. A lot of the OpenClaw design decisions (typed events, sequential trigger execution, structured alert payloads) came from thinking about how agent workflows differ from traditional job queues, and that feels like exactly the kind of conversation that would thrive at an in-person event.

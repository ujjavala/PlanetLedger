# PlanetLedger

PlanetLedger is a hackathon-ready, agent-first sustainability finance prototype.

Flow:
`User -> Auth0 -> PlanetLedger Agent -> APIs -> Insights -> UI`

## Stack

- Next.js (App Router) + TypeScript
- TailwindCSS
- Lucide React icons
- Auth0 (`@auth0/nextjs-auth0`)
- Simple REST API routes

## Auth0 Responsibilities

- Authentication (`/auth/login`, `/auth/logout`)
- User identity context (`user_id`, email)
- Agent context and memory inputs (preferences, past interactions)
- Scope-based permissions for agent actions:
  - `read:transactions`
  - `write:insights`
  - `update:score`

## API Endpoints

- `POST /api/upload`
  - Upload CSV (`merchant,amount,category,date`)
- `GET /api/transactions`
  - Returns parsed transactions
- `GET /api/score`
  - Returns impact score summary
- `GET /api/agent-insights`
  - Uses Auth0 user context + behavior history to return personalized insights

## Agent Logic

Impact scoring categories:

- Fast Fashion -> `RED`
- Food Delivery -> `YELLOW`
- Grocery -> `GREEN` or `YELLOW`
- Hygiene Products -> `RED`
- Transport -> `GREEN` or `YELLOW`

Points:

- `GREEN = +10`
- `YELLOW = +5`
- `RED = -2`

The agent detects behavioral patterns (example: weekend fast-fashion bursts), personalizes suggestions, and adapts to profile preferences.

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Configure env:

```bash
cp .env.example .env.local
```

3. Fill Auth0 values in `.env.local`.

4. Run dev server:

```bash
npm run dev
```

5. Open:

`http://localhost:3000`

## Notes

- Prototype uses in-memory storage for speed and demo simplicity.
- No external banking APIs are used.
- Suitable for demo environments under 48-hour build constraints.

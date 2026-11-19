# Grunberg

A single-player, text-based RPG dungeon crawler that runs in the browser: a chat-driven story, a map that draws itself as you explore, quests, combat and inventory.

**Play:** https://grunberg-game.vercel.app

> **Status:** the deterministic game engine and the authoritative API are done. Next up: moving the frontend to Next.js and connecting it to the API ([roadmap](#roadmap)).

## Core idea: content as data, the engine decides

- **Story is data.** Dialogues and quests live in JSON files validated with Zod. Content changes without touching code.
- **The engine decides.** All rules live in a pure TypeScript engine: `(state, action) → { state, events }`. The server runs it and is the single source of truth. The client only sends **intents** (`move east`, `equip sword`), never state changes, so it can't cheat.
- **The UI tells the story.** Engine events (`ENEMY_DEFEATED`, `QUEST_COMPLETED`…) become chat narration, map updates and HUD changes.

```mermaid
flowchart LR
  P[Player] -->|chat / arrow keys| W[apps/web<br/>Next.js]
  W -->|intent + expectedVersion| A[apps/api<br/>Fastify]
  C[content/<br/>JSON dialogues, quests] --> E
  A --> E[packages/engine<br/>pure rules]
  E -->|new state + events| A
  A --> D[(Postgres<br/>sessions + event log)]
  A -->|state + events| W
```

## Repository layout

| Path | What it is |
|---|---|
| `packages/engine` | Pure TypeScript game rules: `applyAction(state, action, ctx) → { state, events }`. No I/O and no React, with an injected clock. Unit and property-based tests (fast-check). |
| `apps/api` | Fastify server, the source of truth. Clients send **intents** (`move east`), never state changes. Requests are validated with Zod. Postgres via Drizzle stores sessions with optimistic locking and an append-only event log. |
| `apps/web` | React 19 UI with atomic design (atoms → molecules → organisms) and CSS Modules. Currently on Vite; *migration to Next.js (App Router) in progress*. |
| `docs/` | Game design notes and architecture docs. |

## Running locally

```bash
nvm use                 # Node 22+
npm install
npm test                # engine + API tests
npm run dev             # web app on http://localhost:5173
npm run dev:api         # API on http://localhost:3001 (in-memory storage)

# with Postgres
docker compose up -d
cp apps/api/.env.example apps/api/.env
npm run db:generate --workspace @grunberg/api && npm run db:migrate --workspace @grunberg/api
DATABASE_URL=postgres://grunberg:grunberg@localhost:5432/grunberg npm run dev:api
```

### API

| Method | Path | |
|---|---|---|
| `POST` | `/games` | create a game from a character (`{ character }`) |
| `GET` | `/games/:id` | current state and version |
| `POST` | `/games/:id/actions` | `{ expectedVersion, intent }` → new state and events. Returns `409` on a stale version and `422` on an illegal move. |
| `GET` | `/games/:id/events` | event log of the session |

## Roadmap

- [x] Character creator, game layout, save/load to localStorage
- [x] Monorepo; game rules extracted into a pure, tested engine
- [x] Authoritative Fastify API, Postgres persistence, event log, optimistic locking
- [ ] Move `apps/web` to Next.js App Router: menu, character creator and saves as routes; the game screen as a client component
- [ ] Web ↔ API with TanStack Query: optimistic updates with rollback on `409`/`422`; state survives refreshes and devices
- [ ] Content as data: JSON dialogues and quests validated with Zod; narration generated from engine events
- [ ] Procedural dungeon floors from a seed, minimap with fog of war, arrow-key movement
- [ ] Combat (4 actions), inventory and equipment, quest log
- [ ] Accessibility: full keyboard play, `aria-live` narration, focus management, `prefers-reduced-motion`; axe checks
- [ ] Responsive layout: playable on a phone
- [ ] Storybook for the atomic design components; Playwright e2e for the main flows
- [ ] Accounts (Better Auth: email + GitHub) and save slots
- [ ] Performance budget in CI (Lighthouse)

## License

MIT

# Grunberg

A single-player, text-based RPG dungeon crawler that runs in the browser: a chat-driven story, a map that draws itself as you explore, quests, combat and inventory.

**Play:** https://grunberg-game.vercel.app

> **Status:** the game engine, the API and the Next.js app are in place. Next up: connecting the game screen to the API ([roadmap](#roadmap)).

## Core idea: content as data, the engine decides

- **Story is data.** Dialogues and quests are plain TypeScript data validated with Zod: typed and autocompleted in the editor, checked in CI, and serializable, with no logic inside. Content changes without touching game rules.
- **The engine decides.** All rules live in a pure TypeScript engine: `(state, action) → { state, events }`. The server runs it and is the single source of truth. The client only sends **intents** (`move east`, `equip sword`), never state changes, so it can't cheat.
- **The UI tells the story.** Engine events (`ENEMY_DEFEATED`, `QUEST_COMPLETED`…) become chat narration, map updates and HUD changes.

```mermaid
flowchart LR
  P[Player] -->|chat / arrow keys| W[Next.js UI<br/>apps/web]
  W -->|intent + expectedVersion| R[Route Handlers<br/>/api/games]
  R --> S[packages/game-server<br/>use cases]
  C[content<br/>TS data + Zod] --> E
  S --> E[packages/engine<br/>pure rules]
  E -->|new state + events| S
  S --> D[(Postgres<br/>sessions + event log)]
  R -->|state + events| W
```

## Repository layout

| Path                   | What it is                                                                                                                                                                                                                                                                                               |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/engine`      | Pure TypeScript game rules: `applyAction(state, action, ctx) → { state, events }`. No I/O and no React, with an injected clock. Unit and property-based tests (fast-check).                                                                                                                              |
| `packages/game-server` | Framework-agnostic server logic, the source of truth. Clients send **intents** (`move east`), never state changes. Use cases (`createGame`, `performIntent`…) validate them with Zod and throw domain errors. Postgres via Drizzle stores sessions with optimistic locking and an append-only event log. |
| `apps/web`             | Next.js (App Router) app. Routes `/`, `/new` and `/game` render a React 19 UI built with atomic design and CSS Modules. Thin Route Handlers under `/api/games` call `game-server` and map domain errors to HTTP status codes in one place.                                                               |
| `docs/`                | Game design notes and architecture docs.                                                                                                                                                                                                                                                                 |

## Running locally

```bash
nvm use                 # Node 26 (see .nvmrc)
npm install
npm test                # engine, game-server, store and API route tests
npm run dev             # app + API on http://localhost:3000 (in-memory storage)

# with Postgres
docker compose up -d
export DATABASE_URL=postgres://grunberg:grunberg@localhost:5432/grunberg
npm run db:migrate --workspace @grunberg/game-server   # applies packages/game-server/drizzle/*.sql
npm test                # now also runs the Postgres integration tests
npm run dev

# after changing packages/game-server/src/db/schema.ts
npm run db:generate --workspace @grunberg/game-server   # writes a new migration file
```

### API

| Method | Path                     |                                                                                                                                            |
| ------ | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `POST` | `/api/games`             | create a game from a character (`{ character }`)                                                                                           |
| `GET`  | `/api/games/:id`         | current state and version                                                                                                                  |
| `POST` | `/api/games/:id/actions` | `{ expectedVersion, intent }` → new state and events. Returns `409` with the current game on a stale version and `422` on an illegal move. |
| `GET`  | `/api/games/:id/events`  | event log of the session                                                                                                                   |

## Security model

- **The server is the authority.** Clients send intents, never state. Every input is validated with Zod, including the character-creation rules (stat budget, name charset and length), so calling the API directly gives no advantage over the UI.
- **Game id = bearer secret (until accounts exist).** A random UUIDv4 (122 bits) is the only key to a game. It never appears in page URLs, and `Referrer-Policy: no-referrer` stops it from leaking to other sites.
- **Requests are bounded:**
  - JSON bodies must be `application/json`, which forces a CORS preflight for cross-site calls;
  - same-origin only (`Origin` check);
  - at most 16 KB per body.
- **No personal data on the server.** No accounts, no IPs (not even hashed), no cookies. The only free text is the character name.
- **Rate limits without tracking anyone:**
  - per-IP limits are enforced by Vercel Firewall at the edge, so IPs never reach our database;
  - the app adds global write limits in Postgres (game creation 300/hour, actions 3000/min) that protect the free-tier database quota. Over the limit the API answers `429` with `Retry-After`.
- **Server copies of games expire 24 h after the last change.** Expiry is checked on every read, and a daily cron (`/api/cron/cleanup`, protected by `CRON_SECRET`) deletes the rows. The local save (autosave, export) is the player's own long-term copy.
- **Headers:** CSP (`'self'` only; inline scripts are allowed because pages are statically prerendered), `frame-ancestors 'none'`, `nosniff`, `Permissions-Policy`, no `X-Powered-By`, `Cache-Control: no-store` on the API.
- **Local saves and imported save files** are validated against the same `gameStateSchema` (bounded sizes, 1 MB file limit) before they reach the game.
- **Supply chain:** dependencies are pinned to exact versions (`save-exact`). CI actions are pinned to commit SHAs, the Vercel CLI to an exact version (only in the deploy job), and `GITHUB_TOKEN` is read-only.

## Deployment (Vercel + Neon, both free tiers)

1. **Database:** create a Neon project in an EU region (Frankfurt). Put its _pooled_ connection string into Vercel as `DATABASE_URL`, then run `npm run db:migrate --workspace @grunberg/game-server` with that `DATABASE_URL`.
2. **Cron secret:** add `CRON_SECRET` in Vercel (`openssl rand -hex 32`). Vercel Cron sends it to `/api/cron/cleanup` once a day (`apps/web/vercel.json`).
3. **Firewall:** in Vercel → Firewall, add one rate-limit rule: path starts with `/api/`, 60 requests per 60 s per IP, action _Deny (429)_.
4. **Project settings:** Root Directory `apps/web`, framework Next.js, functions region `fra1`.

Without `DATABASE_URL` the API refuses to run in production instead of silently keeping games in memory.

## Roadmap

- [x] Character creator, game layout, save/load to localStorage
- [x] Monorepo; game rules extracted into a pure, tested engine
- [x] Authoritative game API, Postgres persistence, event log, optimistic locking
- [x] Next.js App Router: menu, character creator and game as routes; the API as Route Handlers
- [ ] Web ↔ API with TanStack Query: optimistic updates with rollback on `409`/`422`; state survives refreshes and devices
- [ ] Content as data: dialogues and quests as TypeScript data validated with Zod; narration generated from engine events
- [ ] Procedural dungeon floors from a seed, minimap with fog of war, arrow-key movement
- [ ] Combat (4 actions), inventory and equipment, quest log
- [ ] Accessibility: full keyboard play, `aria-live` narration, focus management, `prefers-reduced-motion`; axe checks
- [ ] Responsive layout: playable on a phone
- [ ] Storybook for the atomic design components; Playwright e2e for the main flows
- [ ] Accounts (Better Auth: email + GitHub) and save slots
- [ ] Performance budget in CI (Lighthouse)

## License

MIT

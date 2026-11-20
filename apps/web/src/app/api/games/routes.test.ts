import { beforeEach, describe, expect, it } from "vitest";
import { MAX_INTENTS_PER_REQUEST, type Intent } from "@grunberg/engine";
import { MAX_BODY_BYTES } from "@/server/request";
import { RULES } from "@/server/rateLimit";
import { MAX_RESTORE_BODY_BYTES } from "@/server/snapshots";
import { POST as createGame } from "./route";
import { POST as restore } from "./restore/route";
import { GET as getGame } from "./[id]/route";
import { GET as getEvents } from "./[id]/events/route";
import { POST as act } from "./[id]/actions/route";

const character = {
  name: "Aria",
  race: "Elf",
  gender: false,
  class: "Mage",
  stats: { strength: 3, agility: 5, intelligence: 7 },
};

const ORIGIN = "http://grunberg.test";
const UNKNOWN_ID = "00000000-0000-4000-8000-000000000000";

const request = (path: string, init: RequestInit = {}) => new Request(`${ORIGIN}${path}`, init);

const postTo = (path: string, body: unknown, headers: Record<string, string> = {}) =>
  request(path, {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "content-type": "application/json", ...headers },
  });
const post = (body: unknown, headers: Record<string, string> = {}) =>
  postTo("/api/games", body, headers);

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

interface GameView {
  id: string;
  version: number;
  snapshot: string;
  state: { inventory: { currency: { gold: number } } };
}

const newGame = async () => (await (await createGame(post({ character }))).json()) as GameView;

const sendIntents = (id: string, expectedVersion: number, intents: unknown) =>
  act(postTo(`/api/games/${id}/actions`, { expectedVersion, intents }), ctx(id));

const equipUnknown: Intent = { type: "equip", itemId: "legendary_sword" };

describe("/api/games routes", () => {
  beforeEach(() => {
    delete (globalThis as { grunbergStore?: unknown }).grunbergStore;
  });

  it("201 on create, then 200 with the game, its floor and a signed snapshot", async () => {
    const res = await createGame(post({ character }));
    expect(res.status).toBe(201);
    const { id } = await res.json();

    const game = await getGame(request(`/api/games/${id}`), ctx(id));
    expect(game.status).toBe(200);
    expect(await game.json()).toMatchObject({
      version: 0,
      state: { character: { name: "Aria" }, currentFloor: { floorNumber: 1 } },
      snapshot: expect.stringMatching(/^v1\./),
    });
  });

  describe("restore", () => {
    const restoreWith = (snapshot: unknown) => restore(postTo("/api/games/restore", { snapshot }));

    it("201: continues a game from its snapshot under a new id", async () => {
      const original = await newGame();

      const res = await restoreWith(original.snapshot);

      expect(res.status).toBe(201);
      const restored = (await res.json()) as GameView;
      expect(restored.id).not.toBe(original.id);
      expect(restored).toMatchObject({ version: 0, state: original.state });
    });

    it("400 for a snapshot the player edited", async () => {
      const { snapshot } = await newGame();
      const [format, payload, signature] = snapshot.split(".");
      const state = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
      state.inventory.currency.gold = 99999;
      const forged = `${format}.${Buffer.from(JSON.stringify(state)).toString("base64url")}.${signature}`;

      expect((await restoreWith(forged)).status).toBe(400);
      expect((await restoreWith("v1.e30.AAAA")).status).toBe(400);
    });

    it("forged snapshots do not use up the global creation limit", async () => {
      for (let i = 0; i < RULES.createGame.limit; i++) {
        expect((await restoreWith("v1.e30.AAAA")).status).toBe(400);
      }
      expect((await createGame(post({ character }))).status).toBe(201);
    });

    it("413 for a body over the restore size limit", async () => {
      expect((await restoreWith("x".repeat(MAX_RESTORE_BODY_BYTES))).status).toBe(413);
    });
  });

  describe("400: invalid input", () => {
    it.each([
      [
        "stats that don't add up to 15",
        { ...character, stats: { strength: 10, agility: 10, intelligence: 10 } },
      ],
      ["a name over 20 characters", { ...character, name: "A".repeat(21) }],
      ["control characters in the name", { ...character, name: "Ari\u0000a" }],
      ["bidi override characters in the name", { ...character, name: "Ari\u202Ea" }],
      ["an unknown race", { ...character, race: "Orc" }],
    ])("rejects %s", async (_, invalid) => {
      expect((await createGame(post({ character: invalid }))).status).toBe(400);
    });

    it("rejects invalid JSON and a malformed id", async () => {
      expect((await createGame(post("{"))).status).toBe(400);
      expect((await getGame(request("/api/games/x"), ctx("not-a-uuid"))).status).toBe(400);
    });

    it("rejects a raw state change instead of an intent", async () => {
      const { id } = await newGame();
      expect((await sendIntents(id, 0, [{ type: "ADD_ITEM" }])).status).toBe(400);
    });

    it("rejects an empty batch and one over the batch limit", async () => {
      const { id } = await newGame();
      const tooMany = Array(MAX_INTENTS_PER_REQUEST + 1).fill(equipUnknown);
      expect((await sendIntents(id, 0, [])).status).toBe(400);
      expect((await sendIntents(id, 0, tooMany)).status).toBe(400);
    });

    it("normalizes a valid name (trim + NFC)", async () => {
      const res = await createGame(
        post({ character: { ...character, name: "  Zoe\u0308 O'Neil " } }),
      );
      expect(res.status).toBe(201);
      expect((await res.json()).state.character.name).toBe("Zo\u00EB O'Neil");
    });
  });

  it("403 for a cross-origin browser request", async () => {
    expect((await createGame(post({ character }, { origin: "https://evil.example" }))).status).toBe(
      403,
    );
    expect((await createGame(post({ character }, { origin: ORIGIN }))).status).toBe(201);
  });

  it("413 for a body over the size limit, even without Content-Length", async () => {
    const huge = JSON.stringify({ character, padding: "x".repeat(MAX_BODY_BYTES) });
    expect((await createGame(post(huge))).status).toBe(413);
  });

  it("415 without a JSON Content-Type (blocks simple cross-site form/text posts)", async () => {
    const res = await createGame(
      request("/api/games", {
        method: "POST",
        body: JSON.stringify({ character }),
        headers: { "content-type": "text/plain" },
      }),
    );
    expect(res.status).toBe(415);
  });

  it("404 for an unknown game", async () => {
    expect((await getGame(request("/"), ctx(UNKNOWN_ID))).status).toBe(404);
    expect((await getEvents(request("/"), ctx(UNKNOWN_ID))).status).toBe(404);
  });

  it("409 with the current game and its snapshot on a stale version", async () => {
    const { id } = await newGame();
    const res = await sendIntents(id, 5, [equipUnknown]);
    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({
      current: { id, version: 0, snapshot: expect.stringMatching(/^v1\./) },
    });
  });

  it("422 with a reason code when the intent breaks the rules", async () => {
    const { id } = await newGame();
    const res = await sendIntents(id, 0, [equipUnknown]);
    expect(res.status).toBe(422);
    expect(await res.json()).toMatchObject({ reason: "no_effect" });
  });

  it("counts every intent of a batch against the global action limit", async () => {
    const { id } = await newGame();
    const batch = Array(MAX_INTENTS_PER_REQUEST).fill(equipUnknown);
    const fullBatches = RULES.action.limit / MAX_INTENTS_PER_REQUEST;
    for (let i = 0; i < fullBatches; i++)
      expect((await sendIntents(id, 0, batch)).status).toBe(422);
    expect((await sendIntents(id, 0, [equipUnknown])).status).toBe(429);
  });

  it("429 with Retry-After once the global game-creation limit is used up", async () => {
    for (let i = 0; i < RULES.createGame.limit; i++) {
      expect((await createGame(post({ character }))).status).toBe(201);
    }
    const limited = await createGame(post({ character }));
    expect(limited.status).toBe(429);
    expect(Number(limited.headers.get("retry-after"))).toBeGreaterThan(0);
  });

  it("malformed requests do not use up the global creation limit", async () => {
    for (let i = 0; i < RULES.createGame.limit; i++) {
      expect((await createGame(post({}))).status).toBe(400);
    }
    expect((await createGame(post({ character }))).status).toBe(201);
  });

  it("reads are not rate limited by the app (Vercel Firewall limits per IP)", async () => {
    const { id } = await newGame();
    for (let i = 0; i < 50; i++) expect((await getGame(request("/"), ctx(id))).status).toBe(200);
  });
});

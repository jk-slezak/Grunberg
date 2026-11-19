import Fastify from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { applyAction, createInitialGameState } from "@grunberg/engine";
import { IntentRejected, intentToAction } from "./intents";
import { VersionConflict, type GameRepository } from "./repository";
import { actionBody, createGameBody, gameParams } from "./schemas";

export const buildApp = (repo: GameRepository, now: () => number = Date.now) => {
  const app = Fastify({ logger: process.env.NODE_ENV !== "test" }).withTypeProvider<ZodTypeProvider>();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.get("/health", async () => ({ ok: true }));

  app.post("/games", { schema: { body: createGameBody } }, async (req, reply) => {
    const ctx = { now: now() };
    const { state, events } = applyAction(
      createInitialGameState(ctx.now),
      { type: "CREATE_CHARACTER", payload: req.body.character },
      ctx,
    );
    const game = await repo.create(state, events);
    return reply.code(201).send(game);
  });

  app.get("/games/:id", { schema: { params: gameParams } }, async (req, reply) => {
    const game = await repo.get(req.params.id);
    return game ?? reply.code(404).send({ error: "Game not found" });
  });

  app.get("/games/:id/events", { schema: { params: gameParams } }, async (req, reply) => {
    if (!(await repo.get(req.params.id))) return reply.code(404).send({ error: "Game not found" });
    return { events: await repo.events(req.params.id) };
  });

  app.post(
    "/games/:id/actions",
    { schema: { params: gameParams, body: actionBody } },
    async (req, reply) => {
      const game = await repo.get(req.params.id);
      if (!game) return reply.code(404).send({ error: "Game not found" });
      if (game.version !== req.body.expectedVersion) {
        return reply.code(409).send({ error: "Stale game state", current: game });
      }

      try {
        const action = intentToAction(game.state, req.body.intent);
        const { state, events } = applyAction(game.state, action, { now: now() });
        if (events.length === 0) {
          return reply.code(422).send({ error: "Action had no effect" });
        }
        const saved = await repo.save(game.id, game.version, state, events);
        return { ...saved, events };
      } catch (err) {
        if (err instanceof IntentRejected) return reply.code(422).send({ error: err.message });
        if (err instanceof VersionConflict) return reply.code(409).send({ error: "Stale game state" });
        throw err;
      }
    },
  );

  return app;
};

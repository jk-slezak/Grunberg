import { createPostgresRepository } from "./db/postgresRepository";
import { buildApp } from "./app";
import { InMemoryGameRepository } from "./repository";

const url = process.env.DATABASE_URL;
const repo = url ? createPostgresRepository(url) : new InMemoryGameRepository();
if (!url) console.warn("DATABASE_URL not set — using in-memory storage (data is lost on restart)");

const app = buildApp(repo);
await app.listen({ port: Number(process.env.PORT ?? 3001), host: "0.0.0.0" });

import "server-only";
import type { NeonDatabase } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

export type DB = NeonDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { __jonwinDb?: Promise<DB> };

async function connect(): Promise<DB> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const { Pool } = await import("@neondatabase/serverless");
    const { drizzle } = await import("drizzle-orm/neon-serverless");
    return drizzle({ client: new Pool({ connectionString: url }), schema });
  }
  if (process.env.NODE_ENV === "production" && process.env.VERCEL) {
    throw new Error("DATABASE_URL is not set");
  }
  // Local development: embedded Postgres stored in ./.data
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { mkdirSync } = await import("node:fs");
  mkdirSync("./.data", { recursive: true });
  const client = new PGlite(process.env.PGLITE_DIR ?? "./.data/pglite");
  return drizzle({ client, schema }) as unknown as DB;
}

export function getDb(): Promise<DB> {
  globalForDb.__jonwinDb ??= connect();
  return globalForDb.__jonwinDb;
}

export { schema };

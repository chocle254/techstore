// Database connection for command-line scripts (the app uses src/db/index.ts).
import * as schema from "../src/db/schema.ts";
import type { NeonDatabase } from "drizzle-orm/neon-serverless";

type DB = NeonDatabase<typeof schema>;

export async function scriptDb() {
  const url = process.env.DATABASE_URL;
  if (url) {
    const { Pool, neonConfig } = await import("@neondatabase/serverless");
    const { drizzle } = await import("drizzle-orm/neon-serverless");
    const { migrate } = await import("drizzle-orm/neon-serverless/migrator");
    neonConfig.webSocketConstructor ??= WebSocket;
    const pool = new Pool({ connectionString: url });
    const db = drizzle({ client: pool, schema });
    return { db, migrate: () => migrate(db, { migrationsFolder: "./drizzle" }), close: () => pool.end() };
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const client = new PGlite(process.env.PGLITE_DIR ?? "./.data/pglite");
  const pg = drizzle({ client, schema });
  const db = pg as unknown as DB;
  return { db, migrate: () => migrate(pg, { migrationsFolder: "./drizzle" }), close: () => client.close() };
}

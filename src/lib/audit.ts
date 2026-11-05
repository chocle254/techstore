import "server-only";
import { getDb, schema } from "@/db";
import { clientIp } from "./ratelimit";
import type { DB } from "@/db";

type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];

/** Record who did what. Pass `tx` to write inside an existing transaction. */
export async function audit(
  actorId: string | null,
  action: string,
  entity: string,
  entityId: string | null,
  details?: Record<string, unknown>,
  tx?: Tx,
) {
  const db = tx ?? (await getDb());
  await db.insert(schema.auditLog).values({ actorId, action, entity, entityId, details: details ?? null, ip: await clientIp() });
}

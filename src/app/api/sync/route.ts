import { z } from "zod";
import { getDb } from "@/db";
import { currentUser, isBoss, json, sameOrigin } from "@/lib/server/session";
import { ensureSyncTable, pullChanges, pushChanges } from "@/lib/server/sync-store";

const KINDS = ["product", "place", "customer", "order", "sale", "payment", "expense", "chemical", "chemmove", "batch", "stockadj"] as const;
// Prices, products and route days are the boss's to change.
const BOSS_ONLY = new Set(["product", "place"]);

const body = z.object({
  since: z.number().int().min(0),
  changes: z
    .array(
      z.object({
        id: z.string().min(1).max(64).regex(/^[\w-]+$/),
        kind: z.enum(KINDS),
        u: z.number().int().min(0),
        del: z.boolean(),
        data: z.record(z.string(), z.unknown()),
      }),
    )
    .max(500),
});

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "Bad origin" }, 403);
  const me = await currentUser();
  if (!me) return json({ error: "login" }, 401);
  const raw = await req.text();
  if (raw.length > 4_000_000) return json({ error: "Too big" }, 413);
  let input: unknown;
  try {
    input = JSON.parse(raw);
  } catch {
    return json({ error: "Bad data" }, 400);
  }
  const parsed = body.safeParse(input);
  if (!parsed.success) return json({ error: "Bad data" }, 400);

  const db = await getDb();
  await ensureSyncTable(db);
  const boss = isBoss(me);
  // Skip (but acknowledge) changes this person may not make, so their phone stops resending them.
  const allowed = parsed.data.changes.filter((c) => boss || !BOSS_ONLY.has(c.kind));
  await pushChanges(db, me.id, allowed);
  const pulled = await pullChanges(db, parsed.data.since);
  return json({ ...pulled, me: { id: me.id, name: me.name, roles: me.roles } });
}

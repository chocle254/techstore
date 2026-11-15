import { z } from "zod";
import { getDb } from "@/db";
import { currentUser, isBoss, json, sameOrigin } from "@/lib/server/session";
import { ensureSyncTable, pullChanges, pushChanges } from "@/lib/server/sync-store";

const KINDS = ["product", "place", "customer", "order", "sale", "payment", "expense", "chemical", "chemmove", "batch", "stockadj"] as const;
// Prices, products and route days are the boss's to change.
const BOSS_ONLY = new Set(["product", "place"]);
// Production only sees what it needs to plan batches, and may only record batches and chemical counts.
// Customers, sales, payments and expenses never reach a Production phone.
const PROD_READ = ["product", "place", "order", "batch", "chemmove"];
const PROD_WRITE = new Set(["batch", "chemmove"]);
const isProduction = (roles: string[]) => !roles.includes("boss") && !roles.includes("helper") && roles.includes("cook");

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
  const prod = isProduction(me.roles);
  // Skip (but acknowledge) changes this person may not make, so their phone stops resending them.
  const allowed = parsed.data.changes.filter((c) => (prod ? PROD_WRITE.has(c.kind) && c.data.type !== "buy" : boss || !BOSS_ONLY.has(c.kind)));
  await pushChanges(db, me.id, allowed);
  const pulled = await pullChanges(db, parsed.data.since, prod ? PROD_READ : null);
  // Orders reach Production without customer or prices: only what to make, for which day and place.
  if (prod)
    for (const c of pulled.changes) {
      if (c.kind !== "order") continue;
      const d = c.data as Record<string, unknown>;
      const items = Array.isArray(d.items) ? (d.items as Record<string, unknown>[]) : [];
      c.data = { date: d.date, place: d.place, status: d.status, items: items.map(({ p, ml, qty, col }) => ({ p, ml, qty, col })) };
    }
  return json({ ...pulled, me: { id: me.id, name: me.name, roles: me.roles } });
}

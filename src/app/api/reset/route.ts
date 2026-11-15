import { z } from "zod";
import { getDb } from "@/db";
import { currentUser, isBoss, json, sameOrigin } from "@/lib/server/session";
import { ensureSyncTable, resetRecords } from "@/lib/server/sync-store";

// Products, prices and route days are kept; everything recorded day to day is cleared.
const CLEARED = ["customer", "order", "sale", "payment", "expense", "chemical", "chemmove", "batch", "stockadj"];

const body = z.object({ confirm: z.literal("RESET") });

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "Bad origin" }, 403);
  const me = await currentUser();
  if (!me) return json({ error: "login" }, 401);
  if (!isBoss(me)) return json({ error: "Only the boss can reset the records." }, 403);
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "Bad data" }, 400);

  const db = await getDb();
  await ensureSyncTable(db);
  const cleared = await resetRecords(db, me.id, CLEARED);
  return json({ cleared });
}

import { randomBytes } from "node:crypto";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { hashPassword } from "@/lib/auth/password";
import { normalizePhone } from "@/lib/phone";
import { currentUser, destroyAllSessions, isBoss, json, sameOrigin } from "@/lib/server/session";

const { users } = schema;
const TEAM = ["boss", "helper", "cook"] as const;

/** The team list (boss only). */
export async function GET() {
  const me = await currentUser();
  if (!me || !isBoss(me)) return json({ error: "login" }, 401);
  const db = await getDb();
  const rows = await db
    .select({ id: users.id, name: users.name, phone: users.phone, roles: users.roles, suspendedAt: users.suspendedAt })
    .from(users)
    .orderBy(asc(users.name));
  return json({ people: rows.filter((r) => r.roles.some((x) => (TEAM as readonly string[]).includes(x))) });
}

const body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("add"), name: z.string().trim().min(2).max(60), phone: z.string().max(30) }),
  z.object({ action: z.literal("reset"), id: z.uuid() }),
  z.object({ action: z.literal("suspend"), id: z.uuid(), on: z.boolean() }),
]);

const tempPassword = () => randomBytes(6).toString("base64url");

/** Add a helper, reset a password, or suspend someone (boss only). */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "Bad origin" }, 403);
  const me = await currentUser();
  if (!me || !isBoss(me)) return json({ error: "login" }, 401);
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "Check the details." }, 400);
  const db = await getDb();
  const b = parsed.data;

  if (b.action === "add") {
    const phone = normalizePhone(b.phone);
    if (!phone) return json({ error: "That phone number doesn't look right." }, 400);
    const pw = tempPassword();
    const passwordHash = await hashPassword(pw);
    const [existing] = await db.select({ id: users.id, roles: users.roles }).from(users).where(eq(users.phone, phone));
    if (existing?.roles.includes("boss")) return json({ error: "That number is the boss's." }, 400);
    if (existing) {
      await db
        .update(users)
        .set({ name: b.name, roles: ["helper"], passwordHash, mustChangePassword: true, suspendedAt: null, failedLogins: 0, lockedUntil: null })
        .where(eq(users.id, existing.id));
      await destroyAllSessions(existing.id);
    } else {
      await db.insert(users).values({ name: b.name, phone, passwordHash, roles: ["helper"], mustChangePassword: true });
    }
    return json({ password: pw });
  }

  if (b.id === me.id) return json({ error: "You can't do that to your own account here." }, 400);
  const [target] = await db.select({ id: users.id }).from(users).where(eq(users.id, b.id));
  if (!target) return json({ error: "Not found." }, 404);

  if (b.action === "reset") {
    const pw = tempPassword();
    await db
      .update(users)
      .set({ passwordHash: await hashPassword(pw), mustChangePassword: true, failedLogins: 0, lockedUntil: null })
      .where(eq(users.id, b.id));
    await destroyAllSessions(b.id);
    return json({ password: pw });
  }

  await db.update(users).set({ suspendedAt: b.on ? new Date() : null }).where(eq(users.id, b.id));
  if (b.on) await destroyAllSessions(b.id);
  return json({ ok: true });
}

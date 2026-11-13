import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { verifyPassword } from "@/lib/auth/password";
import { normalizePhone } from "@/lib/phone";
import { rateLimit } from "@/lib/ratelimit";
import { canUseApp, createSession, json, publicUser, sameOrigin } from "@/lib/server/session";

const { users } = schema;
const MAX_FAILS = 5;
const LOCK_MINUTES = 15;

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "Bad origin" }, 403);
  const b = (await req.json().catch(() => ({}))) as { phone?: unknown; password?: unknown };
  const phone = normalizePhone(String(b.phone ?? "").slice(0, 40));
  const password = String(b.password ?? "").slice(0, 200);
  if (!phone || !password) return json({ error: "Enter your phone number and password." }, 400);
  if (!(await rateLimit("login", phone))) return json({ error: "Too many tries. Wait 15 minutes." }, 429);

  const db = await getDb();
  const [user] = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  if (user?.lockedUntil && user.lockedUntil > new Date()) {
    return json({ error: `Locked after too many wrong passwords. Try again in ${LOCK_MINUTES} minutes.` }, 423);
  }
  const ok = await verifyPassword(password, user?.passwordHash ?? null);
  if (!user || !ok) {
    if (user) {
      const fails = user.failedLogins + 1;
      await db
        .update(users)
        .set({
          failedLogins: fails >= MAX_FAILS ? 0 : fails,
          lockedUntil: fails >= MAX_FAILS ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null,
        })
        .where(eq(users.id, user.id));
    }
    return json({ error: "Wrong phone number or password." }, 401);
  }
  if (user.suspendedAt || !canUseApp(user.roles)) return json({ error: "This account can't use the app. Ask the boss." }, 403);

  await db.update(users).set({ failedLogins: 0, lockedUntil: null }).where(eq(users.id, user.id));
  await createSession(user.id, req.headers.get("user-agent"));
  return json({ me: publicUser(user) });
}

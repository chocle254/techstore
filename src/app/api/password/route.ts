import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { hashPassword, passwordProblem, verifyPassword } from "@/lib/auth/password";
import { rateLimit } from "@/lib/ratelimit";
import { createSession, currentUser, destroyAllSessions, json, sameOrigin } from "@/lib/server/session";

const { users } = schema;

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "Bad origin" }, 403);
  const me = await currentUser();
  if (!me) return json({ error: "login" }, 401);
  const b = (await req.json().catch(() => ({}))) as { current?: unknown; next?: unknown };
  const current = String(b.current ?? "").slice(0, 200);
  const next = String(b.next ?? "").slice(0, 200);
  const problem = passwordProblem(next);
  if (problem) return json({ error: problem }, 400);
  if (!(await rateLimit("login", "change:" + me.id))) return json({ error: "Too many tries. Try later." }, 429);

  const db = await getDb();
  const [row] = await db.select({ hash: users.passwordHash }).from(users).where(eq(users.id, me.id));
  if (!(await verifyPassword(current, row?.hash ?? null))) return json({ error: "Your current password is wrong." }, 400);
  await db.update(users).set({ passwordHash: await hashPassword(next), mustChangePassword: false }).where(eq(users.id, me.id));
  // Log out other phones that knew the old password, keep this one in.
  await destroyAllSessions(me.id);
  await createSession(me.id, req.headers.get("user-agent"));
  return json({ ok: true });
}

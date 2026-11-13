import "server-only";
import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, lt } from "drizzle-orm";
import { getDb, schema } from "@/db";

const { sessions, users } = schema;

const IS_PROD = process.env.NODE_ENV === "production";
const COOKIE = IS_PROD ? "__Host-jw_session" : "jw_session";
// Phones may stay offline for weeks, so a device stays logged in for a year (renewed on every sync).
const SESSION_DAYS = 365;
const RENEW_WHEN_DAYS_LEFT = 300;

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export type AppUser = { id: string; name: string; phone: string; roles: string[]; mustChangePassword: boolean };

const APP_ROLES = ["boss", "helper", "cook"];
export const canUseApp = (roles: string[]) => roles.some((r) => APP_ROLES.includes(r));
export const isBoss = (u: AppUser) => u.roles.includes("boss");

async function setCookie(token: string, expiresAt: Date) {
  (await cookies()).set(COOKIE, token, { httpOnly: true, secure: IS_PROD, sameSite: "strict", path: "/", expires: expiresAt });
}

export async function createSession(userId: string, userAgent: string | null) {
  const db = await getDb();
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await db.insert(sessions).values({ id: hashToken(token), userId, expiresAt, userAgent: userAgent?.slice(0, 200) ?? null });
  await db.delete(sessions).where(and(eq(sessions.userId, userId), lt(sessions.expiresAt, new Date())));
  await setCookie(token, expiresAt);
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    const db = await getDb();
    await db.delete(sessions).where(eq(sessions.id, hashToken(token)));
  }
  jar.set(COOKIE, "", { httpOnly: true, secure: IS_PROD, sameSite: "strict", path: "/", maxAge: 0 });
}

export async function destroyAllSessions(userId: string) {
  const db = await getDb();
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

/** The logged-in team member for this request, or null. Suspended people count as logged out. */
export async function currentUser(): Promise<AppUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token || token.length > 100) return null;
  const db = await getDb();
  const id = hashToken(token);
  const [row] = await db
    .select({
      id: users.id,
      name: users.name,
      phone: users.phone,
      roles: users.roles,
      mustChangePassword: users.mustChangePassword,
      suspendedAt: users.suspendedAt,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, id), gt(sessions.expiresAt, new Date())))
    .limit(1);
  if (!row || row.suspendedAt || !canUseApp(row.roles)) return null;
  if (row.expiresAt.getTime() - Date.now() < RENEW_WHEN_DAYS_LEFT * 86_400_000) {
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
    await db.update(sessions).set({ expiresAt }).where(eq(sessions.id, id));
    await setCookie(token, expiresAt);
  }
  return { id: row.id, name: row.name, phone: row.phone, roles: row.roles, mustChangePassword: row.mustChangePassword };
}

export const publicUser = (u: AppUser) => ({ id: u.id, name: u.name, phone: u.phone, roles: u.roles, mustChangePassword: u.mustChangePassword });

/** Only accept JSON posts from this site (blocks cross-site form posts). */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return req.headers.get("sec-fetch-site") !== "cross-site";
  try {
    return new URL(origin).host === new URL(req.url).host || new URL(origin).host === req.headers.get("host");
  } catch {
    return false;
  }
}

export const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store" } });

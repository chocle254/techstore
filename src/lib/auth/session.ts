import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, lt } from "drizzle-orm";
import { getDb, schema } from "@/db";

const { sessions, users } = schema;

const IS_PROD = process.env.NODE_ENV === "production";
// "__Host-" cookies must be Secure, path=/, and can't be set for other domains.
export const SESSION_COOKIE = IS_PROD ? "__Host-jw_session" : "jw_session";
const SESSION_DAYS = 14;
const RENEW_WHEN_DAYS_LEFT = 7;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export type Role = (typeof schema.roleEnum.enumValues)[number];
export type SessionUser = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  roles: Role[];
  isTrusted: boolean;
  mustChangePassword: boolean;
};

export async function createSession(userId: string) {
  const db = await getDb();
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  const userAgent = (await headers()).get("user-agent")?.slice(0, 200) ?? null;
  await db.insert(sessions).values({ id: hashToken(token), userId, expiresAt, userAgent });
  // Housekeeping: drop this user's expired sessions.
  await db.delete(sessions).where(and(eq(sessions.userId, userId), lt(sessions.expiresAt, new Date())));
  await setCookie(token, expiresAt);
}

async function setCookie(token: string, expiresAt: Date) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    const db = await getDb();
    await db.delete(sessions).where(eq(sessions.id, hashToken(token)));
  }
  // Overwrite with the same attributes: browsers ignore a __Host- cookie delete that isn't Secure.
  jar.set(SESSION_COOKIE, "", { httpOnly: true, secure: IS_PROD, sameSite: "lax", path: "/", maxAge: 0 });
}

/** Log a user out everywhere (after password change, suspension, or role change). */
export async function destroyAllSessions(userId: string) {
  const db = await getDb();
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

/** The logged-in user for this request, or null. Suspended users are treated as logged out. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length > 100) return null;
  const db = await getDb();
  const id = hashToken(token);
  const [row] = await db
    .select({
      id: users.id,
      name: users.name,
      phone: users.phone,
      email: users.email,
      roles: users.roles,
      isTrusted: users.isTrusted,
      mustChangePassword: users.mustChangePassword,
      suspendedAt: users.suspendedAt,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, id), gt(sessions.expiresAt, new Date())))
    .limit(1);
  if (!row || row.suspendedAt) return null;

  // Sliding expiry: renew sessions that are more than halfway through.
  if (row.expiresAt.getTime() - Date.now() < RENEW_WHEN_DAYS_LEFT * 86_400_000) {
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
    await db.update(sessions).set({ expiresAt }).where(eq(sessions.id, id));
    try {
      await setCookie(token, expiresAt);
    } catch {
      // Cookies can't be set while rendering a Server Component; the next action will renew it.
    }
  }
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    roles: row.roles,
    isTrusted: row.isTrusted,
    mustChangePassword: row.mustChangePassword,
  };
});

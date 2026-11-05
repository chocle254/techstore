"use server";

import { createHash, randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { and, eq, gt, isNull } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { audit } from "@/lib/audit";
import { sendEmail } from "@/lib/email";
import { normalizePhone } from "@/lib/phone";
import { rateLimit } from "@/lib/ratelimit";
import { hashPassword, passwordProblem, verifyPassword } from "./password";
import { createSession, destroyAllSessions, destroySession, getCurrentUser } from "./session";
import { homeFor } from "./guard";

const { users, passwordResets } = schema;

export type FormState = { error?: string; ok?: string } | undefined;

const MAX_FAILS = 5;
const LOCK_MINUTES = 15;
const GENERIC_LOGIN_ERROR = "Wrong phone/email or password.";

function findByIdentifier(identifier: string) {
  const phone = normalizePhone(identifier);
  const email = identifier.includes("@") ? identifier.trim().toLowerCase() : null;
  if (!phone && !email) return null;
  return phone ? eq(users.phone, phone) : eq(users.email, email!);
}

/** Only allow redirects to paths on this site. */
function safeNext(next: unknown): string | null {
  return typeof next === "string" && /^\/(?!\/)[\w\-/?=&.]*$/.test(next) ? next : null;
}

export async function loginAction(_: FormState, form: FormData): Promise<FormState> {
  const identifier = String(form.get("identifier") ?? "").slice(0, 120);
  const password = String(form.get("password") ?? "").slice(0, 200);
  if (!identifier || !password) return { error: "Enter your phone/email and password." };

  if (!(await rateLimit("login", identifier.toLowerCase()))) {
    return { error: "Too many attempts. Wait 15 minutes and try again." };
  }

  const db = await getDb();
  const where = findByIdentifier(identifier);
  const [user] = where ? await db.select().from(users).where(where).limit(1) : [];

  if (user?.lockedUntil && user.lockedUntil > new Date()) {
    return { error: `Account locked after too many wrong passwords. Try again after ${LOCK_MINUTES} minutes.` };
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
      if (fails >= MAX_FAILS) await audit(user.id, "locked", "user", user.id, { reason: "too many failed logins" });
    }
    return { error: GENERIC_LOGIN_ERROR };
  }
  if (user.suspendedAt) return { error: "This account is suspended. Contact JonWin Clean." };

  await db.update(users).set({ failedLogins: 0, lockedUntil: null }).where(eq(users.id, user.id));
  await createSession(user.id);
  await audit(user.id, "login", "user", user.id);

  if (user.mustChangePassword) redirect("/account/password?first=1");
  redirect(safeNext(form.get("next")) ?? homeFor(user));
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

const changeSchema = z.object({
  current: z.string().max(200),
  next: z.string().max(200),
  confirm: z.string().max(200),
});

export async function changePasswordAction(_: FormState, form: FormData): Promise<FormState> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  const parsed = changeSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Fill in all fields." };
  const { current, next, confirm } = parsed.data;
  if (next !== confirm) return { error: "The new passwords don't match." };
  const problem = passwordProblem(next);
  if (problem) return { error: problem };
  if (!(await rateLimit("login", "change:" + me.id))) return { error: "Too many attempts. Try again later." };

  const db = await getDb();
  const [row] = await db.select({ hash: users.passwordHash }).from(users).where(eq(users.id, me.id));
  if (!(await verifyPassword(current, row?.hash ?? null))) return { error: "Your current password is wrong." };

  await db.update(users).set({ passwordHash: await hashPassword(next), mustChangePassword: false }).where(eq(users.id, me.id));
  await destroyAllSessions(me.id);
  await createSession(me.id);
  await audit(me.id, "password_changed", "user", me.id);
  redirect(homeFor(me));
}

const RESET_MINUTES = 30;
const tokenHash = (t: string) => createHash("sha256").update(t).digest("hex");

export async function requestResetAction(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase().slice(0, 120);
  const done: FormState = {
    ok: "If that email belongs to an account, a reset link is on its way. It works for 30 minutes. No email? Ask JonWin Clean to reset your password.",
  };
  if (!z.email().safeParse(email).success) return { error: "Enter a valid email address." };
  if (!(await rateLimit("passwordReset", email))) return done;

  const db = await getDb();
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  // Same answer whether or not the account exists, so emails can't be probed.
  if (!user || user.suspendedAt || !user.passwordHash) return done;

  const token = randomBytes(32).toString("base64url");
  await db.insert(passwordResets).values({
    id: tokenHash(token),
    userId: user.id,
    expiresAt: new Date(Date.now() + RESET_MINUTES * 60_000),
  });
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  await sendEmail(
    email,
    "Reset your JonWin Clean password",
    `Hi ${user.name},\n\nUse this link to choose a new password. It works once, for ${RESET_MINUTES} minutes:\n${site}/reset-password/${token}\n\nIf you didn't ask for this, ignore this email.`,
  );
  await audit(user.id, "password_reset_requested", "user", user.id);
  return done;
}

export async function resetPasswordAction(_: FormState, form: FormData): Promise<FormState> {
  const token = String(form.get("token") ?? "").slice(0, 100);
  const next = String(form.get("next") ?? "").slice(0, 200);
  const confirm = String(form.get("confirm") ?? "").slice(0, 200);
  if (next !== confirm) return { error: "The passwords don't match." };
  const problem = passwordProblem(next);
  if (problem) return { error: problem };

  const db = await getDb();
  const id = tokenHash(token);
  const [reset] = await db
    .select()
    .from(passwordResets)
    .where(and(eq(passwordResets.id, id), isNull(passwordResets.usedAt), gt(passwordResets.expiresAt, new Date())))
    .limit(1);
  if (!reset) return { error: "This link has expired or was already used. Ask for a new one." };

  await db.update(passwordResets).set({ usedAt: new Date() }).where(eq(passwordResets.id, id));
  await db
    .update(users)
    .set({ passwordHash: await hashPassword(next), mustChangePassword: false, failedLogins: 0, lockedUntil: null })
    .where(eq(users.id, reset.userId));
  await destroyAllSessions(reset.userId);
  await audit(reset.userId, "password_reset", "user", reset.userId);
  return { ok: "Password changed. You can now log in." };
}

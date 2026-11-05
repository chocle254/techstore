"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth/guard";
import { hashPassword } from "@/lib/auth/password";
import { destroyAllSessions } from "@/lib/auth/session";
import { normalizePhone } from "@/lib/phone";
import type { FormState } from "@/lib/auth/actions";

const { users } = schema;
const STAFF = ["boss", "helper", "cook", "rider"] as const;

export type TempPasswordState = (FormState & { tempPassword?: string; forName?: string }) | undefined;

const tempPassword = () => randomBytes(9).toString("base64url");

function refresh() {
  revalidatePath("/admin/staff");
  revalidatePath("/admin/customers");
}

export async function createStaffAction(_: TempPasswordState, form: FormData): Promise<TempPasswordState> {
  const boss = await requireUser("boss");
  const parsed = z
    .object({
      name: z.string().trim().min(2).max(80),
      phone: z.string().max(20),
      email: z.email().max(120).optional().or(z.literal("")),
      roles: z.array(z.enum(STAFF)).min(1),
    })
    .safeParse({ ...Object.fromEntries(form), roles: form.getAll("roles") });
  if (!parsed.success) return { error: "Fill in the name, phone, and at least one role." };
  const phone = normalizePhone(parsed.data.phone);
  if (!phone) return { error: "That phone number doesn't look right." };
  const email = parsed.data.email ? parsed.data.email.toLowerCase() : null;

  const db = await getDb();
  const pw = tempPassword();
  const passwordHash = await hashPassword(pw);
  const [existing] = await db.select().from(users).where(eq(users.phone, phone));
  try {
    if (existing) {
      const roles = [...new Set([...existing.roles.filter((r) => r === "customer"), ...parsed.data.roles])];
      await db
        .update(users)
        .set({ name: parsed.data.name, email: email ?? existing.email, roles, passwordHash, mustChangePassword: true })
        .where(eq(users.id, existing.id));
      await destroyAllSessions(existing.id);
      await audit(boss.id, "staff_updated", "user", existing.id, { roles });
    } else {
      const [row] = await db
        .insert(users)
        .values({ name: parsed.data.name, phone, email, roles: [...parsed.data.roles], passwordHash, mustChangePassword: true })
        .returning({ id: users.id });
      await audit(boss.id, "staff_created", "user", row.id, { roles: parsed.data.roles });
    }
  } catch {
    return { error: "That email is already used by another account." };
  }
  refresh();
  return { ok: "Account ready.", tempPassword: pw, forName: parsed.data.name };
}

export async function setRolesAction(_: FormState, form: FormData): Promise<FormState> {
  const boss = await requireUser("boss");
  const parsed = z
    .object({ userId: z.uuid(), roles: z.array(z.enum(STAFF)) })
    .safeParse({ userId: form.get("userId"), roles: form.getAll("roles") });
  if (!parsed.success) return { error: "Invalid roles." };
  const { userId, roles } = parsed.data;
  if (userId === boss.id && !roles.includes("boss")) return { error: "You can't remove your own Boss role." };
  const db = await getDb();
  const [u] = await db.select().from(users).where(eq(users.id, userId));
  if (!u) return { error: "Not found." };
  const next = [...new Set([...u.roles.filter((r) => r === "customer"), ...roles])];
  await db.update(users).set({ roles: next.length ? next : ["customer"] }).where(eq(users.id, userId));
  await destroyAllSessions(userId);
  await audit(boss.id, "roles_changed", "user", userId, { from: u.roles, to: next });
  refresh();
  return { ok: "Roles saved." };
}

export async function suspendAction(_: FormState, form: FormData): Promise<FormState> {
  const boss = await requireUser("boss");
  const parsed = z
    .object({ userId: z.uuid(), suspend: z.enum(["1", "0"]), reason: z.string().trim().max(200).default("") })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Invalid request." };
  const { userId, suspend, reason } = parsed.data;
  if (userId === boss.id) return { error: "You can't suspend yourself." };
  if (suspend === "1" && reason.length < 3) return { error: "Write a short reason." };
  const db = await getDb();
  await db
    .update(users)
    .set(suspend === "1" ? { suspendedAt: new Date(), suspendedReason: reason } : { suspendedAt: null, suspendedReason: null })
    .where(eq(users.id, userId));
  if (suspend === "1") await destroyAllSessions(userId);
  await audit(boss.id, suspend === "1" ? "suspended" : "unsuspended", "user", userId, { reason });
  refresh();
  return { ok: suspend === "1" ? "Account suspended. Their records are kept." : "Account active again." };
}

export async function resetPasswordForAction(_: TempPasswordState, form: FormData): Promise<TempPasswordState> {
  const boss = await requireUser("boss");
  const userId = z.uuid().safeParse(form.get("userId"));
  if (!userId.success) return { error: "Invalid request." };
  const db = await getDb();
  const pw = tempPassword();
  const [u] = await db
    .update(users)
    .set({ passwordHash: await hashPassword(pw), mustChangePassword: true, failedLogins: 0, lockedUntil: null })
    .where(eq(users.id, userId.data))
    .returning({ name: users.name });
  if (!u) return { error: "Not found." };
  await destroyAllSessions(userId.data);
  await audit(boss.id, "password_reset_by_boss", "user", userId.data);
  return { ok: "Password reset.", tempPassword: pw, forName: u.name };
}

export async function setTrustedAction(form: FormData) {
  const boss = await requireUser("boss");
  const parsed = z.object({ userId: z.uuid(), trusted: z.enum(["1", "0"]) }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return;
  const db = await getDb();
  await db.update(users).set({ isTrusted: parsed.data.trusted === "1" }).where(eq(users.id, parsed.data.userId));
  await audit(boss.id, parsed.data.trusted === "1" ? "marked_trusted" : "unmarked_trusted", "user", parsed.data.userId);
  refresh();
}

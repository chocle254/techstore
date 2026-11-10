"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/guard";
import { rateLimit } from "@/lib/ratelimit";
import { bookInput, bookOrder, cancelScheduled, completeInput, completeOrder, rescheduleOrder } from "@/lib/scheduled";
import type { FormState } from "@/lib/auth/actions";

function refresh() {
  revalidatePath("/admin", "layout");
}

export async function bookOrderAction(raw: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireUser("boss", "helper");
  if (!(await rateLimit("write", user.id))) return { ok: false, error: "Too many requests. Wait a minute." };
  const parsed = bookInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the order details." };
  const res = await bookOrder(parsed.data, user);
  if (res.ok) refresh();
  return res.ok ? { ok: true } : res;
}

export async function completeOrderAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("boss", "helper");
  const raw = Object.fromEntries(form);
  const parsed = completeInput.safeParse({
    id: raw.id,
    method: raw.method,
    mpesaRef: String(raw.mpesaRef ?? "").toUpperCase() || undefined,
    deposit: raw.deposit ? Number(raw.deposit) : undefined,
    promisedBy: raw.promisedBy || undefined,
  });
  if (!parsed.success) return { error: "Choose how they paid." };
  const res = await completeOrder(parsed.data, user);
  if (!res.ok) return { error: res.error };
  refresh();
  return { ok: parsed.data.method === "credit" ? `Saved as receipt #${res.receiptNo}. It's now in Owed money.` : `Saved as receipt #${res.receiptNo}.` };
}

export async function rescheduleAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("boss", "helper");
  const parsed = z.object({ id: z.uuid(), dueDate: z.iso.date() }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Pick a date." };
  const res = await rescheduleOrder(parsed.data.id, parsed.data.dueDate, user);
  if (!res.ok) return { error: res.error };
  refresh();
  return { ok: "Date changed." };
}

export async function cancelScheduledAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("boss", "helper");
  const parsed = z.object({ id: z.uuid(), reason: z.string().trim().min(3, "Say why.").max(200) }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Say why." };
  const res = await cancelScheduled(parsed.data.id, parsed.data.reason, user);
  if (!res.ok) return { error: res.error };
  refresh();
  return { ok: "Cancelled." };
}

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/guard";
import { completeDelivery, startDelivery, unassignRider } from "@/lib/delivery";
import { normalizeMpesaCode } from "@/lib/payments";
import { rateLimit } from "@/lib/ratelimit";
import type { FormState } from "@/lib/auth/actions";

function refresh(orderId: string) {
  revalidatePath("/rider");
  revalidatePath("/admin/orders");
  revalidatePath(`/orders/${orderId}`);
}

const idOf = (form: FormData) => z.uuid().safeParse(form.get("orderId"));

/** The rider has left with the order. Only works on orders given to this rider. */
export async function startDeliveryAction(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireUser("rider");
  const id = idOf(form);
  if (!id.success) return { error: "Order not found." };
  const res = await startDelivery(id.data, me, me.id);
  if (!res.ok) return { error: res.error };
  refresh(id.data);
  return { ok: "On the way. The customer can see it." };
}

export async function deliveredAction(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireUser("rider");
  const id = idOf(form);
  if (!id.success) return { error: "Order not found." };
  if (!(await rateLimit("write", "rider:" + me.id))) return { error: "Too many taps. Wait a moment." };
  const method = form.get("method") === "mpesa" ? "mpesa" : "cash";
  const ref = method === "mpesa" ? normalizeMpesaCode(String(form.get("ref") ?? "")) : null;
  if (method === "mpesa" && !ref) return { error: "An M-Pesa code has 10 letters and numbers, like SGL7XK2P9Q." };
  const res = await completeDelivery(id.data, me, { method, ref }, me.id);
  if (!res.ok) return { error: res.error };
  refresh(id.data);
  return { ok: "Delivered. Thank you!" };
}

/** Couldn't deliver: the order goes back to the office with the reason. */
export async function handBackAction(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireUser("rider");
  const id = idOf(form);
  const reason = z.string().trim().min(3, "Say what happened.").max(200).safeParse(form.get("reason"));
  if (!id.success) return { error: "Order not found." };
  if (!reason.success) return { error: reason.error.issues[0]?.message ?? "Say what happened." };
  const res = await unassignRider(id.data, reason.data, me, me.id);
  if (!res.ok) return { error: res.error };
  refresh(id.data);
  return { ok: "Handed back to the office." };
}

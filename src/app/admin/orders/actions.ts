"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { audit } from "@/lib/audit";
import { hasRole, requireUser } from "@/lib/auth/guard";
import { recordPayment, saleBalance, voidSale } from "@/lib/sales";
import { assignRider, canMarkReady, completeDelivery, startDelivery, unassignRider } from "@/lib/delivery";
import { normalizeMpesaCode } from "@/lib/payments";
import type { FormState } from "@/lib/auth/actions";

const { orders } = schema;

async function loadOrder(id: string) {
  const db = await getDb();
  const [o] = await db.select().from(orders).where(eq(orders.id, id));
  return o ?? null;
}

function refresh(id: string) {
  revalidatePath("/admin/orders");
  revalidatePath("/rider");
  revalidatePath(`/orders/${id}`);
  revalidatePath("/admin", "layout");
}

/** Staff checked M-Pesa and the money is there: record the payment and mark the order paid. */
export async function confirmPaidAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("boss", "helper");
  const id = z.uuid().safeParse(form.get("orderId"));
  if (!id.success) return { error: "Order not found." };
  const o = await loadOrder(id.data);
  if (!o || o.status !== "pending") return { error: "This order is not waiting for payment." };
  const ref = normalizeMpesaCode(String(form.get("ref") ?? o.payRef ?? ""));
  if (!ref) return { error: "Enter the 10-character M-Pesa code you checked." };
  const bal = await saleBalance(o.saleId);
  if (!bal || bal.voided) return { error: "Order not found." };
  if (bal.balance > 0) {
    const res = await recordPayment(o.saleId, bal.balance, "mpesa", ref, user);
    if (!res.ok) return { error: res.error };
  }
  const db = await getDb();
  await db.update(orders).set({ status: "paid", payRef: ref, updatedAt: new Date() }).where(eq(orders.id, o.id));
  await audit(user.id, "order_paid", "order", o.id, { ref });
  refresh(o.id);
  return { ok: "Marked as paid." };
}

/** The kitchen has made and packed the order: it now shows on the delivery dashboard for riders. */
export async function markReadyAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("boss", "helper");
  const id = z.uuid().safeParse(form.get("orderId"));
  if (!id.success) return { error: "Order not found." };
  const o = await loadOrder(id.data);
  if (!o) return { error: "Order not found." };
  if (o.status === "pending" && o.payMethod === "mpesa") return { error: "Confirm the M-Pesa payment first." };
  if (!canMarkReady(o)) return { error: "This order can't be marked ready now." };
  const db = await getDb();
  const [done] = await db
    .update(orders)
    .set({ status: "ready", updatedAt: new Date() })
    .where(and(eq(orders.id, o.id), eq(orders.status, o.status)))
    .returning({ id: orders.id });
  if (!done) return { error: "The order changed while you were working. Refresh and try again." };
  await audit(user.id, "order_ready", "order", o.id, { from: o.status });
  refresh(o.id);
  return { ok: "Marked ready. Riders can see it now." };
}

/** Move an order along. Riders are given orders with assignRiderAction; delivering a COD order records the money. */
export async function setStatusAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("boss", "helper");
  const parsed = z
    .object({
      orderId: z.uuid(),
      status: z.enum(["out_for_delivery", "delivered"]),
      method: z.enum(["cash", "mpesa"]).default("cash"),
      ref: z.string().max(20).optional(),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Choose a status." };
  const { orderId, status, method } = parsed.data;
  const res =
    status === "out_for_delivery"
      ? await startDelivery(orderId, user)
      : await completeDelivery(orderId, user, { method, ref: method === "mpesa" ? normalizeMpesaCode(parsed.data.ref ?? "") : null });
  if (!res.ok) return { error: res.error };
  refresh(orderId);
  return { ok: "Updated." };
}

export async function assignRiderAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("boss", "helper");
  const parsed = z.object({ orderId: z.uuid(), riderId: z.uuid() }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Choose a rider." };
  const res = await assignRider(parsed.data.orderId, parsed.data.riderId, user);
  if (!res.ok) return { error: res.error };
  refresh(parsed.data.orderId);
  revalidatePath("/rider");
  return { ok: "Rider assigned." };
}

export async function unassignRiderAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("boss", "helper");
  const orderId = z.uuid().safeParse(form.get("orderId"));
  if (!orderId.success) return { error: "Order not found." };
  const res = await unassignRider(orderId.data, "Taken back by office", user);
  if (!res.ok) return { error: res.error };
  refresh(orderId.data);
  revalidatePath("/rider");
  return { ok: "Taken back from the rider." };
}

/** Cancel an order: voids the sale (stock goes back, payments are refunded as a new entry). */
export async function cancelOrderAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("boss", "helper");
  const parsed = z.object({ orderId: z.uuid(), reason: z.string().trim().min(3, "Say why.").max(200) }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Say why." };
  const o = await loadOrder(parsed.data.orderId);
  if (!o || o.status === "cancelled" || o.status === "delivered") return { error: "This order can't be cancelled." };
  if (o.status !== "pending" && !hasRole(user, "boss")) return { error: "Only the boss can cancel a paid order." };
  const res = await voidSale(o.saleId, "Order cancelled: " + parsed.data.reason, user);
  if (!res.ok) return { error: res.error };
  const db = await getDb();
  await db.update(orders).set({ status: "cancelled", updatedAt: new Date() }).where(eq(orders.id, o.id));
  await audit(user.id, "order_cancelled", "order", o.id, { reason: parsed.data.reason, from: o.status });
  refresh(o.id);
  return { ok: "Cancelled." };
}

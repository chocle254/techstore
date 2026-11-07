import "server-only";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { audit } from "@/lib/audit";
import { recordPayment, saleBalance } from "@/lib/sales";
import type { SessionUser } from "@/lib/auth/session";

const { orders, users } = schema;

type Result = { ok: true } | { ok: false; error: string };
export type OrderStatus = (typeof schema.orderStatusEnum.enumValues)[number];

/** Riders only get orders the kitchen has marked ready (or that are already with a rider). */
export function canAssign(o: { status: OrderStatus; payMethod: "mpesa" | "cod" }) {
  return o.status === "ready" || o.status === "assigned";
}

/** An order can be marked ready once it's paid, or straight away when the customer pays cash on delivery. */
export function canMarkReady(o: { status: OrderStatus; payMethod: "mpesa" | "cod" }) {
  return o.status === "paid" || (o.status === "pending" && o.payMethod === "cod");
}

/** Give an order to a rider. Only someone with the rider role who isn't suspended. */
export async function assignRider(orderId: string, riderId: string, actor: SessionUser): Promise<Result> {
  const db = await getDb();
  const [rider] = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(and(eq(users.id, riderId), sql`'rider' = any(${users.roles})`, isNull(users.suspendedAt)));
  if (!rider) return { ok: false, error: "Choose a rider." };
  const [o] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!o || !canAssign(o)) return { ok: false, error: "This order can't be given to a rider now." };
  const [done] = await db
    .update(orders)
    .set({ riderId: rider.id, status: "assigned", updatedAt: new Date() })
    .where(and(eq(orders.id, o.id), eq(orders.status, o.status)))
    .returning({ id: orders.id });
  if (!done) return { ok: false, error: "The order changed while you were working. Refresh and try again." };
  await audit(actor.id, "order_assigned", "order", o.id, { riderId: rider.id, rider: rider.name, from: o.status });
  return { ok: true };
}

/** Take the order back from its rider (e.g. couldn't reach the customer). It goes back to the ready list. */
export async function unassignRider(orderId: string, reason: string, actor: SessionUser, onlyRiderId?: string): Promise<Result> {
  const db = await getDb();
  const [o] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!o || !o.riderId || (onlyRiderId && o.riderId !== onlyRiderId)) return { ok: false, error: "Order not found." };
  if (o.status !== "assigned" && o.status !== "out_for_delivery") return { ok: false, error: "This order is no longer with a rider." };
  const back: OrderStatus = "ready";
  const [done] = await db
    .update(orders)
    .set({ riderId: null, status: back, updatedAt: new Date() })
    .where(and(eq(orders.id, o.id), eq(orders.status, o.status)))
    .returning({ id: orders.id });
  if (!done) return { ok: false, error: "The order changed while you were working. Refresh and try again." };
  await audit(actor.id, "order_returned", "order", o.id, { reason, riderId: o.riderId, from: o.status });
  return { ok: true };
}

/** Rider has left with the order. */
export async function startDelivery(orderId: string, actor: SessionUser, onlyRiderId?: string): Promise<Result> {
  const db = await getDb();
  const [done] = await db
    .update(orders)
    .set({ status: "out_for_delivery", updatedAt: new Date() })
    .where(and(eq(orders.id, orderId), eq(orders.status, "assigned"), onlyRiderId ? eq(orders.riderId, onlyRiderId) : undefined))
    .returning({ id: orders.id });
  if (!done) return { ok: false, error: "This order can't be started. Refresh the page." };
  await audit(actor.id, "order_status", "order", orderId, { from: "assigned", to: "out_for_delivery" });
  return { ok: true };
}

/**
 * The customer has the bottles. On a cash-on-delivery order, whatever is still owed is recorded as
 * received by the person marking it (cash, or M-Pesa with its code).
 */
export async function completeDelivery(
  orderId: string,
  actor: SessionUser,
  pay: { method: "cash" | "mpesa"; ref: string | null },
  onlyRiderId?: string,
): Promise<Result> {
  const db = await getDb();
  const [o] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!o || (onlyRiderId && o.riderId !== onlyRiderId)) return { ok: false, error: "Order not found." };
  const from: OrderStatus[] = o.payMethod === "cod" ? ["pending", "paid", "ready", "assigned", "out_for_delivery"] : ["paid", "ready", "assigned", "out_for_delivery"];
  if (!from.includes(o.status)) return { ok: false, error: "This order can't be marked delivered." };

  // Claim the order first so two taps (or rider + office at once) can't record the cash twice.
  const [claimed] = await db
    .update(orders)
    .set({ status: "delivered", updatedAt: new Date() })
    .where(and(eq(orders.id, o.id), inArray(orders.status, from)))
    .returning({ id: orders.id });
  if (!claimed) return { ok: false, error: "This order was already updated. Refresh the page." };

  let collected = 0;
  const bal = await saleBalance(o.saleId);
  if (bal && bal.balance > 0) {
    if (o.payMethod !== "cod") {
      // M-Pesa order not confirmed paid: undo, the office must confirm the payment first.
      await db.update(orders).set({ status: o.status, updatedAt: new Date() }).where(eq(orders.id, o.id));
      return { ok: false, error: "This order isn't paid yet. The office must confirm the M-Pesa payment first." };
    }
    if (pay.method === "mpesa" && !pay.ref) {
      await db.update(orders).set({ status: o.status, updatedAt: new Date() }).where(eq(orders.id, o.id));
      return { ok: false, error: "Enter the customer's M-Pesa code." };
    }
    const res = await recordPayment(o.saleId, bal.balance, pay.method, pay.ref, actor);
    if (!res.ok) {
      await db.update(orders).set({ status: o.status, updatedAt: new Date() }).where(eq(orders.id, o.id));
      return res;
    }
    collected = bal.balance;
  }
  await audit(actor.id, "order_status", "order", o.id, { from: o.status, to: "delivered", collected, method: collected ? pay.method : null });
  return { ok: true };
}

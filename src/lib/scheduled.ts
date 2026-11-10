import "server-only";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { audit } from "@/lib/audit";
import { normalizePhone } from "@/lib/phone";
import { recordWalkInSale, type SaleResult } from "@/lib/sales";
import type { SessionUser } from "@/lib/auth/session";

const { scheduledOrders, scheduledOrderItems, variants, products, sales } = schema;

export const bookInput = z.object({
  customerName: z.string().trim().min(2, "Write the customer's name.").max(80),
  customerPhone: z.string().trim().max(20).optional(),
  dueDate: z.iso.date("Pick a date."),
  note: z.string().trim().max(300).optional(),
  items: z
    .array(z.object({ variantId: z.uuid(), qty: z.number().int().min(1).max(1000) }))
    .min(1, "Add at least one product.")
    .max(30),
});

export type BookInput = z.infer<typeof bookInput>;
type Result = { ok: true } | { ok: false; error: string };

export async function bookOrder(input: BookInput, actor: SessionUser): Promise<Result & { id?: string }> {
  let phone: string | null = null;
  if (input.customerPhone) {
    phone = normalizePhone(input.customerPhone);
    if (!phone) return { ok: false, error: "The phone number doesn't look right." };
  }
  const qty = new Map<string, number>();
  for (const i of input.items) qty.set(i.variantId, (qty.get(i.variantId) ?? 0) + i.qty);

  const db = await getDb();
  const found = await db.select({ id: variants.id }).from(variants).where(inArray(variants.id, [...qty.keys()]));
  if (found.length !== qty.size) return { ok: false, error: "A product in this order no longer exists." };

  const id = await db.transaction(async (tx) => {
    const [o] = await tx
      .insert(scheduledOrders)
      .values({ customerName: input.customerName, customerPhone: phone, dueDate: input.dueDate, note: input.note || null, createdBy: actor.id })
      .returning({ id: scheduledOrders.id });
    await tx.insert(scheduledOrderItems).values([...qty].map(([variantId, q]) => ({ orderId: o.id, variantId, qty: q })));
    await audit(actor.id, "order_scheduled", "scheduled_order", o.id, { dueDate: input.dueDate, customer: input.customerName }, tx);
    return o.id;
  });
  return { ok: true, id };
}

export type ScheduledView = {
  id: string;
  customerName: string;
  customerPhone: string | null;
  dueDate: string;
  note: string | null;
  status: "scheduled" | "done" | "cancelled";
  cancelReason: string | null;
  receiptNo: number | null;
  updatedAt: Date;
  lines: { variantId: string; name: string; sizeMl: number; qty: number; unitPrice: number }[];
  total: number;
};

export async function listScheduled(status: ScheduledView["status"], limit = 200): Promise<ScheduledView[]> {
  const db = await getDb();
  const rows = await db
    .select({
      id: scheduledOrders.id,
      customerName: scheduledOrders.customerName,
      customerPhone: scheduledOrders.customerPhone,
      dueDate: scheduledOrders.dueDate,
      note: scheduledOrders.note,
      status: scheduledOrders.status,
      cancelReason: scheduledOrders.cancelReason,
      receiptNo: sales.receiptNo,
      saleTotal: sales.total,
      updatedAt: scheduledOrders.updatedAt,
    })
    .from(scheduledOrders)
    .leftJoin(sales, eq(sales.id, scheduledOrders.saleId))
    .where(eq(scheduledOrders.status, status))
    .orderBy(status === "scheduled" ? asc(scheduledOrders.dueDate) : desc(scheduledOrders.updatedAt), asc(scheduledOrders.createdAt))
    .limit(limit);
  if (rows.length === 0) return [];

  const items = await db
    .select({
      orderId: scheduledOrderItems.orderId,
      variantId: scheduledOrderItems.variantId,
      qty: scheduledOrderItems.qty,
      name: products.name,
      sizeMl: variants.sizeMl,
      price: variants.price,
    })
    .from(scheduledOrderItems)
    .innerJoin(variants, eq(variants.id, scheduledOrderItems.variantId))
    .innerJoin(products, eq(products.id, variants.productId))
    .where(inArray(scheduledOrderItems.orderId, rows.map((r) => r.id)))
    .orderBy(asc(products.name), asc(variants.sizeMl));

  return rows.map((r) => {
    const lines = items
      .filter((i) => i.orderId === r.id)
      .map((i) => ({ variantId: i.variantId, name: i.name, sizeMl: i.sizeMl, qty: i.qty, unitPrice: i.price }));
    return {
      ...r,
      receiptNo: r.receiptNo ?? null,
      // Done orders show what was actually charged; open ones show today's prices.
      total: r.saleTotal ?? lines.reduce((s, l) => s + l.qty * l.unitPrice, 0),
      lines,
    };
  });
}

/** How many open orders are late, due today, and due in the next 7 days. */
export async function scheduledCounts(today: string): Promise<{ late: number; today: number; week: number }> {
  const db = await getDb();
  const [r] = await db
    .select({
      late: sql<number>`count(*) filter (where ${scheduledOrders.dueDate} < ${today})`.mapWith(Number),
      today: sql<number>`count(*) filter (where ${scheduledOrders.dueDate} = ${today})`.mapWith(Number),
      week: sql<number>`count(*) filter (where ${scheduledOrders.dueDate} > ${today} and ${scheduledOrders.dueDate} <= (${today}::date + 7))`.mapWith(Number),
    })
    .from(scheduledOrders)
    .where(eq(scheduledOrders.status, "scheduled"));
  return r ?? { late: 0, today: 0, week: 0 };
}

export const completeInput = z.object({
  id: z.uuid(),
  method: z.enum(["cash", "mpesa", "credit"]),
  mpesaRef: z.string().trim().max(30).optional(),
  deposit: z.number().int().min(0).max(10_000_000).optional(),
  promisedBy: z.iso.date().optional(),
});

/** Delivered or collected: record it as a sale. Pay later goes to Owed money like any other sale. */
export async function completeOrder(input: z.infer<typeof completeInput>, actor: SessionUser): Promise<SaleResult> {
  const db = await getDb();
  const [o] = await db.select().from(scheduledOrders).where(eq(scheduledOrders.id, input.id));
  if (!o || o.status === "cancelled") return { ok: false, error: "Order not found." };
  if (input.method === "credit" && !o.customerPhone) return { ok: false, error: "Pay later needs the customer's phone number." };
  const items = await db
    .select({ variantId: scheduledOrderItems.variantId, qty: scheduledOrderItems.qty })
    .from(scheduledOrderItems)
    .where(eq(scheduledOrderItems.orderId, o.id));

  // Same clientId every time, so tapping Done twice can't record two sales.
  const sale = await recordWalkInSale(
    {
      clientId: `sched:${o.id}`,
      items,
      method: input.method,
      mpesaRef: input.method === "mpesa" ? input.mpesaRef : undefined,
      customerName: o.customerName,
      customerPhone: o.customerPhone ?? undefined,
      deposit: input.method === "credit" ? input.deposit : undefined,
      dueDate: input.method === "credit" ? input.promisedBy : undefined,
      note: ["Scheduled order", o.note].filter(Boolean).join(": "),
    },
    actor,
  );
  if (!sale.ok) return sale;

  await db
    .update(scheduledOrders)
    .set({ status: "done", saleId: sale.saleId, updatedAt: new Date() })
    .where(and(eq(scheduledOrders.id, o.id), eq(scheduledOrders.status, "scheduled")));
  if (!sale.duplicate) await audit(actor.id, "scheduled_done", "scheduled_order", o.id, { saleId: sale.saleId, method: input.method });
  return sale;
}

export async function rescheduleOrder(id: string, dueDate: string, actor: SessionUser): Promise<Result> {
  const db = await getDb();
  const [done] = await db
    .update(scheduledOrders)
    .set({ dueDate, updatedAt: new Date() })
    .where(and(eq(scheduledOrders.id, id), eq(scheduledOrders.status, "scheduled")))
    .returning({ id: scheduledOrders.id });
  if (!done) return { ok: false, error: "This order is no longer open." };
  await audit(actor.id, "scheduled_moved", "scheduled_order", id, { dueDate });
  return { ok: true };
}

export async function cancelScheduled(id: string, reason: string, actor: SessionUser): Promise<Result> {
  const db = await getDb();
  const [done] = await db
    .update(scheduledOrders)
    .set({ status: "cancelled", cancelReason: reason, updatedAt: new Date() })
    .where(and(eq(scheduledOrders.id, id), eq(scheduledOrders.status, "scheduled")))
    .returning({ id: scheduledOrders.id });
  if (!done) return { ok: false, error: "This order is no longer open." };
  await audit(actor.id, "scheduled_cancelled", "scheduled_order", id, { reason });
  return { ok: true };
}

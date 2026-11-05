import "server-only";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { audit } from "@/lib/audit";
import { normalizePhone } from "@/lib/phone";
import { ksh } from "@/lib/format";
import type { SessionUser } from "@/lib/auth/session";

const { sales, saleItems, payments, stockMovements, variants, users } = schema;

export const saleInput = z
  .object({
    clientId: z.string().min(8).max(64),
    items: z
      .array(z.object({ variantId: z.uuid(), qty: z.number().int().min(1).max(1000) }))
      .min(1)
      .max(30),
    method: z.enum(["cash", "mpesa", "credit"]),
    mpesaRef: z.string().trim().max(30).optional(),
    customerId: z.uuid().optional(),
    customerName: z.string().trim().max(80).optional(),
    customerPhone: z.string().trim().max(20).optional(),
    deposit: z.number().int().min(0).max(10_000_000).optional(),
    dueDate: z.iso.date().optional(),
    note: z.string().trim().max(300).optional(),
  })
  .refine((s) => s.method !== "credit" || s.customerId || (s.customerName && s.customerPhone), {
    message: "Pay later needs the customer's name and phone.",
  });

export type SaleInput = z.infer<typeof saleInput>;
export type SaleResult = { ok: true; saleId: string; receiptNo: number; duplicate?: boolean } | { ok: false; error: string };

/** Records a walk-in sale. Safe to retry: the same clientId is only saved once. */
export async function recordWalkInSale(input: SaleInput, actor: SessionUser): Promise<SaleResult> {
  const db = await getDb();

  const [existing] = await db.select({ id: sales.id, receiptNo: sales.receiptNo }).from(sales).where(eq(sales.clientId, input.clientId));
  if (existing) return { ok: true, saleId: existing.id, receiptNo: existing.receiptNo, duplicate: true };

  // Merge repeated lines for the same bottle.
  const qtyByVariant = new Map<string, number>();
  for (const i of input.items) qtyByVariant.set(i.variantId, (qtyByVariant.get(i.variantId) ?? 0) + i.qty);

  const rows = await db
    .select({ id: variants.id, price: variants.price, cost: variants.cost, isActive: variants.isActive })
    .from(variants)
    .where(inArray(variants.id, [...qtyByVariant.keys()]));
  if (rows.length !== qtyByVariant.size || rows.some((r) => !r.isActive)) return { ok: false, error: "A product in this sale is no longer available." };
  if (rows.some((r) => r.price <= 0)) return { ok: false, error: "A product in this sale has no price yet. Set it in Products first." };

  const lines = rows.map((r) => ({ variantId: r.id, qty: qtyByVariant.get(r.id)!, unitPrice: r.price, unitCost: r.cost }));
  const total = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);

  const deposit = input.method === "credit" ? Math.min(input.deposit ?? 0, total) : total;
  if (input.method === "credit" && deposit >= total) return { ok: false, error: "The deposit covers the full amount, so choose Cash or M-Pesa instead." };

  // Find or create the customer record (no login needed).
  let customerId = input.customerId ?? null;
  if (!customerId && input.customerPhone) {
    const phone = normalizePhone(input.customerPhone);
    if (!phone) return { ok: false, error: "The customer's phone number doesn't look right." };
    const [found] = await db.select({ id: users.id }).from(users).where(eq(users.phone, phone));
    customerId =
      found?.id ??
      (await db
        .insert(users)
        .values({ name: input.customerName || "Customer", phone, roles: ["customer"] })
        .returning({ id: users.id }))[0].id;
  }

  try {
    const result = await db.transaction(async (tx) => {
      const [sale] = await tx
        .insert(sales)
        .values({
          clientId: input.clientId,
          channel: "walk_in",
          customerId,
          soldBy: actor.id,
          paymentMethod: input.method,
          subtotal: total,
          total,
          dueDate: input.method === "credit" ? (input.dueDate ?? null) : null,
          note: input.note || null,
        })
        .returning({ id: sales.id, receiptNo: sales.receiptNo });

      await tx.insert(saleItems).values(lines.map((l) => ({ ...l, saleId: sale.id })));
      await tx.insert(stockMovements).values(
        lines.map((l) => ({ variantId: l.variantId, delta: -l.qty, reason: "sale" as const, refId: sale.id, createdBy: actor.id })),
      );
      if (deposit > 0) {
        await tx.insert(payments).values({
          saleId: sale.id,
          amount: deposit,
          method: input.method === "credit" ? "cash" : input.method,
          reference: input.mpesaRef || null,
          receivedBy: actor.id,
          note: input.method === "credit" ? "Deposit" : null,
        });
      }
      await audit(actor.id, "sale_recorded", "sale", sale.id, { total, method: input.method, receiptNo: sale.receiptNo }, tx);
      return sale;
    });
    return { ok: true, saleId: result.id, receiptNo: result.receiptNo };
  } catch (e) {
    // Two retries of the same sale arriving at once: the unique clientId stops the second.
    const [dupe] = await db.select({ id: sales.id, receiptNo: sales.receiptNo }).from(sales).where(eq(sales.clientId, input.clientId));
    if (dupe) return { ok: true, saleId: dupe.id, receiptNo: dupe.receiptNo, duplicate: true };
    throw e;
  }
}

/** Amount still owed on a sale (0 if fully paid). */
export async function saleBalance(saleId: string): Promise<{ total: number; paid: number; balance: number; voided: boolean } | null> {
  const db = await getDb();
  const [row] = await db
    .select({
      total: sales.total,
      voidedAt: sales.voidedAt,
      paid: sql<number>`coalesce((select sum(${payments.amount}) from ${payments} where ${payments.saleId} = ${sales.id}), 0)`.mapWith(Number),
    })
    .from(sales)
    .where(eq(sales.id, saleId));
  if (!row) return null;
  return { total: row.total, paid: row.paid, balance: Math.max(0, row.total - row.paid), voided: !!row.voidedAt };
}

export async function recordPayment(
  saleId: string,
  amount: number,
  method: "cash" | "mpesa",
  reference: string | null,
  actor: SessionUser,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const bal = await saleBalance(saleId);
  if (!bal || bal.voided) return { ok: false, error: "Sale not found." };
  if (bal.balance <= 0) return { ok: false, error: "This sale is already fully paid." };
  if (amount > bal.balance) return { ok: false, error: `Only ${ksh(bal.balance)} is owed.` };
  const db = await getDb();
  await db.transaction(async (tx) => {
    await tx.insert(payments).values({ saleId, amount, method, reference, receivedBy: actor.id });
    await audit(actor.id, "payment_recorded", "sale", saleId, { amount, method }, tx);
  });
  return { ok: true };
}

/** Voids a mistaken sale: puts the bottles back in stock and refunds anything paid. Boss only. */
export async function voidSale(saleId: string, reason: string, actor: SessionUser): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = await getDb();
  const [sale] = await db.select().from(sales).where(and(eq(sales.id, saleId), isNull(sales.voidedAt)));
  if (!sale) return { ok: false, error: "Sale not found or already voided." };
  const items = await db.select().from(saleItems).where(eq(saleItems.saleId, saleId));
  const bal = await saleBalance(saleId);

  await db.transaction(async (tx) => {
    await tx.update(sales).set({ voidedAt: new Date(), voidedBy: actor.id, voidReason: reason }).where(eq(sales.id, saleId));
    await tx.insert(stockMovements).values(
      items.map((i) => ({ variantId: i.variantId, delta: i.qty, reason: "void" as const, refId: saleId, createdBy: actor.id, note: reason })),
    );
    if (bal && bal.paid > 0) {
      await tx.insert(payments).values({ saleId, amount: -bal.paid, method: "cash", receivedBy: actor.id, note: "Refund (sale voided): " + reason });
    }
    await audit(actor.id, "sale_voided", "sale", saleId, { reason, total: sale.total, refunded: bal?.paid ?? 0 }, tx);
  });
  return { ok: true };
}

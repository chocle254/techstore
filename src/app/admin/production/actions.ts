"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth/guard";
import { rateLimit } from "@/lib/ratelimit";
import { sizeLabel } from "@/lib/format";
import type { FormState } from "@/lib/auth/actions";

const { products, variants, stockMovements } = schema;

/**
 * A batch was mixed and bottled: add the filled bottles of each size to stock.
 * All lines of one batch share a ref id so they show as one batch in the history.
 */
export async function recordBatchAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("boss", "helper", "cook");
  const productId = z.uuid().safeParse(form.get("productId"));
  if (!productId.success) return { error: "Choose the product." };
  const note = String(form.get("note") ?? "").trim().slice(0, 200);
  if (!(await rateLimit("write", "batch:" + user.id))) return { error: "Too many saves. Wait a moment." };

  const db = await getDb();
  const sizes = await db
    .select({ id: variants.id, sizeMl: variants.sizeMl, product: products.name })
    .from(variants)
    .innerJoin(products, eq(products.id, variants.productId))
    .where(and(eq(variants.productId, productId.data), eq(variants.isActive, true), eq(products.isActive, true)));
  if (!sizes.length) return { error: "That product has no sizes for sale." };

  const lines: { variantId: string; qty: number; sizeMl: number }[] = [];
  for (const s of sizes) {
    const raw = String(form.get(`qty:${s.id}`) ?? "").trim();
    if (!raw) continue;
    const qty = Number(raw);
    if (!Number.isInteger(qty) || qty < 0 || qty > 10_000) return { error: `Check the number for ${sizeLabel(s.sizeMl)}.` };
    if (qty > 0) lines.push({ variantId: s.id, qty, sizeMl: s.sizeMl });
  }
  if (!lines.length) return { error: "Enter how many bottles you filled of at least one size." };

  const batchId = randomUUID();
  const litres = lines.reduce((t, l) => t + l.qty * l.sizeMl, 0) / 1000;
  await db.transaction(async (tx) => {
    await tx.insert(stockMovements).values(
      lines.map((l) => ({ variantId: l.variantId, delta: l.qty, reason: "batch" as const, refId: batchId, note: note || null, createdBy: user.id })),
    );
    await audit(user.id, "batch_recorded", "product", productId.data, { batchId, litres, lines: lines.map((l) => ({ size: l.sizeMl, qty: l.qty })), note }, tx);
  });
  revalidatePath("/admin", "layout");
  const bottles = lines.reduce((t, l) => t + l.qty, 0);
  return { ok: `Saved: ${bottles} bottles (${litres.toLocaleString("en-KE")} L) of ${sizes[0].product.replace(/^JonWin\s+/, "")} added to stock.` };
}

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

const { products, variants, stockMovements, recipeItems, chemicalMovements } = schema;

/**
 * A batch was cooked and bottled: add the filled bottles to stock and take the chemicals it used out of the store.
 * All lines of one batch share a ref id so they show as one batch in the history.
 */
export async function recordBatchAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("boss", "helper", "cook");
  const productId = z.uuid().safeParse(form.get("productId"));
  if (!productId.success) return { error: "Choose the product." };
  const note = String(form.get("note") ?? "").trim().slice(0, 200);
  const batches = Number(form.get("batches") ?? 1);
  if (!Number.isInteger(batches) || batches < 1 || batches > 20) return { error: "How many batches did you cook? (1 to 20)" };
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
  const recipe = await db.select({ chemicalId: recipeItems.chemicalId, amount: recipeItems.amount }).from(recipeItems).where(eq(recipeItems.productId, productId.data));
  await db.transaction(async (tx) => {
    if (recipe.length) {
      await tx.insert(chemicalMovements).values(
        recipe.map((r) => ({
          chemicalId: r.chemicalId,
          delta: String(-Number(r.amount) * batches),
          reason: "batch" as const,
          refId: batchId,
          note: `${batches} batch${batches === 1 ? "" : "es"}`,
          createdBy: user.id,
        })),
      );
    }
    await tx.insert(stockMovements).values(
      lines.map((l) => ({ variantId: l.variantId, delta: l.qty, reason: "batch" as const, refId: batchId, note: note || null, createdBy: user.id })),
    );
    await audit(user.id, "batch_recorded", "product", productId.data, { batchId, litres, batches, lines: lines.map((l) => ({ size: l.sizeMl, qty: l.qty })), note }, tx);
  });
  revalidatePath("/admin", "layout");
  const bottles = lines.reduce((t, l) => t + l.qty, 0);
  const name = sizes[0].product.replace(/^JonWin\s+/, "");
  return {
    ok: `Saved: ${bottles} bottles (${litres.toLocaleString("en-KE")} L) of ${name}.${recipe.length ? " Chemicals updated." : " No recipe set for this product, so no chemicals were taken off."}`,
  };
}

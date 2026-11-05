"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth/guard";
import type { FormState } from "@/lib/auth/actions";

export async function stockChangeAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("boss", "helper");
  const parsed = z
    .object({
      variantId: z.uuid(),
      kind: z.enum(["restock", "adjustment"]),
      qty: z.coerce.number().int().min(-10_000).max(10_000),
      note: z.string().trim().max(200).default(""),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success || parsed.data.qty === 0) return { error: "Enter how many bottles." };
  const { variantId, kind, qty, note } = parsed.data;
  if (kind === "restock" && qty < 0) return { error: "New stock must be more than 0. Use Correction to reduce." };
  if (kind === "adjustment" && note.length < 3) return { error: "Say why you're correcting the count (e.g. broken, counted wrong)." };

  const db = await getDb();
  const [v] = await db.select({ id: schema.variants.id }).from(schema.variants).where(eq(schema.variants.id, variantId));
  if (!v) return { error: "Size not found." };
  await db.transaction(async (tx) => {
    const [m] = await tx
      .insert(schema.stockMovements)
      .values({ variantId, delta: qty, reason: kind, note: note || null, createdBy: user.id })
      .returning({ id: schema.stockMovements.id });
    await audit(user.id, kind === "restock" ? "stock_added" : "stock_corrected", "variant", variantId, { qty, note, movementId: m.id }, tx);
  });
  revalidatePath("/admin", "layout");
  return { ok: `${qty > 0 ? "+" : ""}${qty} saved.` };
}

"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth/guard";
import type { FormState } from "@/lib/auth/actions";

const { chemicals, chemicalMovements, recipeItems } = schema;

// Amounts may be fractions (half a packet), typed with a dot or a comma.
const amount = z.preprocess((v) => String(v ?? "").trim().replace(",", "."), z.coerce.number().min(0).max(100_000));

function refresh() {
  revalidatePath("/admin/chemicals");
  revalidatePath("/admin/production");
}

export async function addChemicalAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("boss", "helper");
  const parsed = z
    .object({ name: z.string().trim().min(2, "Give it a name.").max(60), unit: z.string().trim().min(1, "Say how it comes, e.g. packet.").max(30), have: amount.optional() })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  const db = await getDb();
  const [row] = await db.insert(chemicals).values({ name: parsed.data.name, unit: parsed.data.unit }).onConflictDoNothing().returning({ id: chemicals.id });
  if (!row) return { error: "A chemical with that name already exists." };
  if (parsed.data.have && parsed.data.have > 0) {
    await db.insert(chemicalMovements).values({ chemicalId: row.id, delta: String(parsed.data.have), reason: "adjustment", note: "Starting amount", createdBy: user.id });
  }
  await audit(user.id, "chemical_added", "chemical", row.id, parsed.data);
  refresh();
  return { ok: "Added." };
}

/** Bought more (adds to the store), or counted the store and the number was different (sets it). */
export async function chemicalStockAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("boss", "helper");
  const parsed = z.object({ chemicalId: z.uuid(), mode: z.enum(["bought", "count"]), qty: amount }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Enter a number." };
  const { chemicalId, mode, qty } = parsed.data;
  const db = await getDb();
  const [cur] = await db
    .select({ onHand: sql<string>`coalesce(sum(${chemicalMovements.delta}), 0)` })
    .from(chemicalMovements)
    .where(eq(chemicalMovements.chemicalId, chemicalId));
  const now = Number(cur?.onHand ?? 0);
  const delta = mode === "bought" ? qty : qty - now;
  if (mode === "bought" && qty <= 0) return { error: "How many did you buy?" };
  if (delta === 0) return { ok: "No change." };
  await db.insert(chemicalMovements).values({
    chemicalId,
    delta: String(delta),
    reason: mode === "bought" ? "purchase" : "adjustment",
    note: mode === "count" ? `Counted: ${qty}` : null,
    createdBy: user.id,
  });
  await audit(user.id, mode === "bought" ? "chemical_bought" : "chemical_counted", "chemical", chemicalId, { from: now, delta });
  refresh();
  return { ok: mode === "bought" ? "Added to the store." : "Store corrected." };
}

/** Set how much of a chemical one batch of a product uses. 0 takes it out of the recipe. */
export async function setRecipeAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("boss", "helper");
  const parsed = z.object({ productId: z.uuid(), chemicalId: z.uuid(), amount }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Enter how much one batch uses." };
  const { productId, chemicalId, amount: a } = parsed.data;
  const db = await getDb();
  if (a === 0) {
    await db.delete(recipeItems).where(and(eq(recipeItems.productId, productId), eq(recipeItems.chemicalId, chemicalId)));
  } else {
    await db
      .insert(recipeItems)
      .values({ productId, chemicalId, amount: String(a) })
      .onConflictDoUpdate({ target: [recipeItems.productId, recipeItems.chemicalId], set: { amount: String(a) } });
  }
  await audit(user.id, "recipe_changed", "product", productId, { chemicalId, amount: a });
  refresh();
  return { ok: a === 0 ? "Removed from the recipe." : "Saved." };
}

export async function renameChemicalAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("boss", "helper");
  const parsed = z
    .object({ chemicalId: z.uuid(), name: z.string().trim().min(2).max(60), unit: z.string().trim().min(1).max(30), isActive: z.literal("on").optional() })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Give it a name and a unit." };
  const { chemicalId, name, unit, isActive } = parsed.data;
  const db = await getDb();
  try {
    await db.update(chemicals).set({ name, unit, isActive: isActive === "on" }).where(eq(chemicals.id, chemicalId));
  } catch {
    return { error: "Another chemical already has that name." };
  }
  await audit(user.id, "chemical_updated", "chemical", chemicalId, { name, unit, isActive: isActive === "on" });
  refresh();
  return { ok: "Saved." };
}

"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth/guard";
import type { FormState } from "@/lib/auth/actions";

const { deliveryAreas } = schema;

export async function saveAreaAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("boss");
  const parsed = z
    .object({
      id: z.uuid().optional().or(z.literal("")),
      name: z.string().trim().min(2, "Name the area.").max(60),
      fee: z.coerce.number().int().min(0).max(100_000),
      isActive: z.literal("on").optional(),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  const { id, name, fee, isActive } = parsed.data;
  const db = await getDb();
  try {
    if (id) {
      const [before] = await db.select().from(deliveryAreas).where(eq(deliveryAreas.id, id));
      if (!before) return { error: "Area not found." };
      await db.update(deliveryAreas).set({ name, fee, isActive: isActive === "on" }).where(eq(deliveryAreas.id, id));
      await audit(user.id, "area_changed", "delivery_area", id, { from: { name: before.name, fee: before.fee, isActive: before.isActive }, to: { name, fee, isActive: isActive === "on" } });
    } else {
      const [row] = await db.insert(deliveryAreas).values({ name, fee }).returning({ id: deliveryAreas.id });
      await audit(user.id, "area_added", "delivery_area", row.id, { name, fee });
    }
  } catch {
    return { error: "There is already an area with that name." };
  }
  revalidatePath("/admin/areas");
  revalidatePath("/");
  return { ok: "Saved." };
}

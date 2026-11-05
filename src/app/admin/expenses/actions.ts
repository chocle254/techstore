"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth/guard";
import { ymdNairobi } from "@/lib/format";
import type { FormState } from "@/lib/auth/actions";

const { expenses } = schema;

export async function addExpenseAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("boss", "helper");
  const parsed = z
    .object({
      category: z.enum(schema.expenseCategoryEnum.enumValues),
      amount: z.coerce.number().int().min(1).max(10_000_000),
      spentOn: z.iso.date(),
      note: z.string().trim().max(200).default(""),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Enter the amount and date." };
  if (parsed.data.spentOn > ymdNairobi()) return { error: "The date can't be in the future." };
  const db = await getDb();
  const [row] = await db.insert(expenses).values({ ...parsed.data, createdBy: user.id }).returning({ id: expenses.id });
  await audit(user.id, "expense_added", "expense", row.id, parsed.data);
  revalidatePath("/admin", "layout");
  return { ok: "Expense saved." };
}

export async function voidExpenseAction(form: FormData) {
  const user = await requireUser("boss");
  const id = z.uuid().safeParse(form.get("id"));
  if (!id.success) return;
  const db = await getDb();
  const [row] = await db
    .update(expenses)
    .set({ voidedAt: new Date(), voidedBy: user.id })
    .where(and(eq(expenses.id, id.data), isNull(expenses.voidedAt)))
    .returning({ amount: expenses.amount });
  if (row) await audit(user.id, "expense_voided", "expense", id.data, { amount: row.amount });
  revalidatePath("/admin", "layout");
}

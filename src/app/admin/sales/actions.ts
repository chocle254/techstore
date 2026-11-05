"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/guard";
import { recordPayment, voidSale } from "@/lib/sales";
import type { FormState } from "@/lib/auth/actions";

export async function voidSaleAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("boss");
  const parsed = z.object({ saleId: z.uuid(), reason: z.string().trim().min(3).max(200) }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Write a short reason (at least 3 letters)." };
  const res = await voidSale(parsed.data.saleId, parsed.data.reason, user);
  if (!res.ok) return { error: res.error };
  revalidatePath("/admin", "layout");
  return { ok: "Sale voided. Stock returned and any payment refunded." };
}

export async function recordPaymentAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("boss", "helper");
  const parsed = z
    .object({
      saleId: z.uuid(),
      amount: z.coerce.number().int().min(1).max(10_000_000),
      method: z.enum(["cash", "mpesa"]),
      reference: z.string().trim().max(30).optional(),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Enter the amount received." };
  const { saleId, amount, method, reference } = parsed.data;
  const res = await recordPayment(saleId, amount, method, reference?.toUpperCase() || null, user);
  if (!res.ok) return { error: res.error };
  revalidatePath("/admin", "layout");
  return { ok: "Payment recorded." };
}

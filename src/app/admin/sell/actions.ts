"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/guard";
import { rateLimit } from "@/lib/ratelimit";
import { recordWalkInSale, saleInput, type SaleResult } from "@/lib/sales";

export async function recordSaleAction(raw: unknown): Promise<SaleResult> {
  const user = await requireUser("boss", "helper");
  if (!(await rateLimit("write", user.id))) return { ok: false, error: "Too many requests. Wait a minute." };
  const parsed = saleInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the sale details." };
  const result = await recordWalkInSale(parsed.data, user);
  if (result.ok) {
    revalidatePath("/admin", "layout");
  }
  return result;
}

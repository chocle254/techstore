import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { audit } from "@/lib/audit";
import { getCurrentUser } from "@/lib/auth/session";
import { fromOurSite } from "@/lib/auth/same-origin";
import { normalizeMpesaCode } from "@/lib/payments";
import { rateLimit } from "@/lib/ratelimit";

/**
 * The customer types the M-Pesa code from their SMS. This is a normal form post that reloads the order page,
 * so nothing in the app waits on it (some phone browsers froze while a background request was pending).
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!fromOurSite(req) || !z.uuid().safeParse(id).success) return new Response("Forbidden", { status: 403 });
  const back = (q: string) => new Response(null, { status: 303, headers: { Location: `/orders/${id}?${q}`, "Cache-Control": "no-store" } });
  const me = await getCurrentUser();
  if (!me) return new Response(null, { status: 303, headers: { Location: `/login?next=/orders/${id}` } });

  const form = await req.formData();
  const code = normalizeMpesaCode(String(form.get("code") ?? ""));
  if (!code) return back("payerr=code");
  if (!(await rateLimit("write", "payref:" + me.id))) return back("payerr=busy");

  const db = await getDb();
  const { orders } = schema;
  const [o] = await db.select().from(orders).where(and(eq(orders.id, id), eq(orders.customerId, me.id)));
  if (!o) return back("payerr=missing");
  if (o.status !== "pending") return back("sent=1");
  await db.update(orders).set({ payRef: code, updatedAt: new Date() }).where(eq(orders.id, o.id));
  await audit(me.id, "payment_code_sent", "order", o.id, { code });
  revalidatePath("/admin/orders");
  return back("sent=1");
}

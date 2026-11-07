import { revalidatePath } from "next/cache";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth/session";
import { fromOurSite } from "@/lib/auth/same-origin";
import { rateLimit } from "@/lib/ratelimit";
import { checkStk } from "@/lib/upesipay";

/** "I've entered my PIN, check now": asks UpesiPay in case its callback didn't reach us. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!fromOurSite(req) || !z.uuid().safeParse(id).success) return new Response("Forbidden", { status: 403 });
  const back = (q: string) => new Response(null, { status: 303, headers: { Location: `/orders/${id}?${q}`, "Cache-Control": "no-store" } });
  const me = await getCurrentUser();
  if (!me) return new Response(null, { status: 303, headers: { Location: `/login?next=/orders/${id}` } });
  const db = await getDb();
  const [o] = await db.select({ id: schema.orders.id }).from(schema.orders).where(and(eq(schema.orders.id, id), eq(schema.orders.customerId, me.id)));
  if (!o) return back("");
  if (!(await rateLimit("write", "stkcheck:" + me.id))) return back("stk=waiting");
  const result = await checkStk(id);
  if (result === "paid") revalidatePath("/admin/orders");
  return back(result === "paid" ? "stk=paid" : result === "failed" ? "stk=failed" : "stk=waiting");
}

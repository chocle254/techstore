import { z } from "zod";
import { getDb, schema } from "@/db";
import { and, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import { fromOurSite } from "@/lib/auth/same-origin";
import { rateLimit } from "@/lib/ratelimit";
import { sendStk } from "@/lib/upesipay";

/** "Send M-Pesa prompt to my phone": a plain form post that reloads the order page with the result. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!fromOurSite(req) || !z.uuid().safeParse(id).success) return new Response("Forbidden", { status: 403 });
  const back = (q: string) => new Response(null, { status: 303, headers: { Location: `/orders/${id}?${q}`, "Cache-Control": "no-store" } });
  const me = await getCurrentUser();
  if (!me) return new Response(null, { status: 303, headers: { Location: `/login?next=/orders/${id}` } });
  const db = await getDb();
  const [o] = await db.select({ id: schema.orders.id }).from(schema.orders).where(and(eq(schema.orders.id, id), eq(schema.orders.customerId, me.id)));
  if (!o) return back("stk=error&why=" + encodeURIComponent("We couldn't find this order on your account."));
  if (!(await rateLimit("write", "stk:" + me.id))) return back("stk=error&why=" + encodeURIComponent("Too many tries. Wait a minute."));
  const res = await sendStk(id);
  return res.ok ? back("stk=sent") : back("stk=error&why=" + encodeURIComponent(res.error));
}

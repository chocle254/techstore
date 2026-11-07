import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";
import { and, desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { audit } from "@/lib/audit";
import { saleBalance } from "@/lib/sales";

/**
 * M-Pesa PIN prompts (STK push) through UpesiPay (https://upesipay.com/docs).
 *
 * Switched on by setting, in Vercel → Settings → Environment Variables:
 *   UPESIPAY_USERNAME   the 20-character API username
 *   UPESIPAY_PASSWORD   the 40-character API password
 *   UPESIPAY_CHANNEL_ID your payment channel id (a number from UpesiPay), or "wallet"
 * Optional: UPESIPAY_TOKEN, the ready-made Basic token from the UpesiPay dashboard, if the
 * username:password token doesn't work.
 *
 * UpesiPay's callback has no signature, so each callback URL carries an HMAC of the order id
 * that only this server can make, and a payment only counts if it matches a prompt we sent.
 */
const API = "https://upesipay.com/api/v2";
const { orders, payments, stkRequests } = schema;

function config() {
  const user = process.env.UPESIPAY_USERNAME;
  const pass = process.env.UPESIPAY_PASSWORD;
  const channel = process.env.UPESIPAY_CHANNEL_ID;
  const token = process.env.UPESIPAY_TOKEN || (user && pass ? Buffer.from(`${user}:${pass}`).toString("base64") : "");
  const secret = process.env.UPESIPAY_PASSWORD || process.env.UPESIPAY_TOKEN || "";
  if (!token || !channel || !secret) return null;
  return { token, secret, channel: channel === "wallet" ? "wallet" : Number(channel) };
}

/** True when UpesiPay is set up, so the shop can offer "Prompt me". */
export const stkEnabled = () => config() !== null;

const sign = (orderId: string, secret: string) => createHmac("sha256", secret).update("upesipay-callback:" + orderId).digest("base64url");

export function callbackTokenOk(orderId: string, token: string): boolean {
  const cfg = config();
  if (!cfg || !token) return false;
  const want = Buffer.from(sign(orderId, cfg.secret));
  const got = Buffer.from(token);
  return want.length === got.length && timingSafeEqual(want, got);
}

/** Our public address, for the callback. UpesiPay only accepts https. */
async function origin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  return `https://${host}`;
}

type Result = { ok: true } | { ok: false; error: string };

/** Ask UpesiPay to show an M-Pesa PIN prompt on the customer's phone for what the order still owes. */
export async function sendStk(orderId: string): Promise<Result> {
  const cfg = config();
  if (!cfg) return { ok: false, error: "M-Pesa prompts aren't set up yet." };
  const db = await getDb();
  const [o] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!o || o.status !== "pending" || o.payMethod !== "mpesa") return { ok: false, error: "This order isn't waiting for an M-Pesa payment." };
  const bal = await saleBalance(o.saleId);
  if (!bal || bal.voided || bal.balance <= 0) return { ok: false, error: "Nothing is owed on this order." };

  // One prompt at a time: M-Pesa itself rejects a second one while the first is on screen.
  const [last] = await db.select().from(stkRequests).where(eq(stkRequests.orderId, o.id)).orderBy(desc(stkRequests.createdAt)).limit(1);
  if (last && last.status === "sent" && Date.now() - last.createdAt.getTime() < 45_000) {
    return { ok: false, error: "A prompt was just sent. Check your phone, or try again in a minute." };
  }

  const callback = `${await origin()}/api/upesipay/callback?o=${o.id}&t=${sign(o.id, cfg.secret)}`;
  let body: { success?: boolean; message?: string; error_code?: string; data?: { checkout_request_id?: string; merchant_request_id?: string } };
  try {
    const res = await fetch(`${API}/collections/initiate/`, {
      method: "POST",
      headers: { Authorization: `Basic ${cfg.token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ channel_id: cfg.channel, phone_number: o.contactPhone, amount: bal.balance, callback_url: callback }),
      signal: AbortSignal.timeout(20_000),
    });
    body = await res.json().catch(() => ({}));
    if (!res.ok || !body.success || !body.data?.checkout_request_id) {
      console.error("UpesiPay STK push failed", res.status, body.error_code, body.message);
      return { ok: false, error: "We couldn't send the M-Pesa prompt. Please pay with the till number below." };
    }
  } catch (e) {
    console.error("UpesiPay unreachable", e);
    return { ok: false, error: "We couldn't reach M-Pesa. Please try again, or pay with the till number below." };
  }
  await db.insert(stkRequests).values({
    orderId: o.id,
    checkoutRequestId: body.data.checkout_request_id,
    merchantRequestId: body.data.merchant_request_id ?? null,
    phone: o.contactPhone,
    amount: bal.balance,
  });
  await audit(o.customerId, "stk_sent", "order", o.id, { amount: bal.balance, checkoutRequestId: body.data.checkout_request_id });
  return { ok: true };
}

/**
 * Record what UpesiPay told us about a prompt. On success, mark the order paid (once, even if the
 * callback and a manual check arrive together).
 */
export async function settleStk(orderId: string, checkoutRequestId: string, status: string): Promise<"paid" | "noted" | "unknown"> {
  const db = await getDb();
  const [req] = await db
    .select()
    .from(stkRequests)
    .where(and(eq(stkRequests.orderId, orderId), eq(stkRequests.checkoutRequestId, checkoutRequestId)));
  if (!req) return "unknown";
  const clean = ["success", "failed", "cancelled", "timeout"].includes(status) ? status : "failed";
  if (req.status === "sent") await db.update(stkRequests).set({ status: clean, updatedAt: new Date() }).where(eq(stkRequests.id, req.id));
  if (clean !== "success") return "noted";

  const [o] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!o) return "unknown";
  // Claim the order first so only one of callback / check records the money.
  const [claimed] = await db
    .update(orders)
    .set({ status: "paid", payRef: checkoutRequestId.slice(0, 40), updatedAt: new Date() })
    .where(and(eq(orders.id, o.id), eq(orders.status, "pending")))
    .returning({ id: orders.id });
  if (!claimed) return "noted";
  const bal = await saleBalance(o.saleId);
  const amount = Math.min(req.amount, bal?.balance ?? 0);
  if (amount > 0) {
    await db.insert(payments).values({ saleId: o.saleId, amount, method: "mpesa", reference: checkoutRequestId.slice(0, 40), receivedBy: null, note: "M-Pesa prompt (UpesiPay)" });
  }
  await audit(null, "order_paid", "order", o.id, { via: "upesipay", checkoutRequestId, amount });
  return "paid";
}

/** For "I've entered my PIN": ask UpesiPay about the latest prompt, in case the callback didn't arrive. */
export async function checkStk(orderId: string): Promise<"paid" | "waiting" | "failed" | "none"> {
  const cfg = config();
  if (!cfg) return "none";
  const db = await getDb();
  const [req] = await db.select().from(stkRequests).where(eq(stkRequests.orderId, orderId)).orderBy(desc(stkRequests.createdAt)).limit(1);
  if (!req) return "none";
  if (req.status === "success") return (await settleStk(orderId, req.checkoutRequestId, "success")) === "unknown" ? "none" : "paid";
  if (req.status !== "sent") return "failed";

  // The docs show two forms of this address; try both.
  const urls = [`${API}/transactions/${encodeURIComponent(req.checkoutRequestId)}/`, `${API}/transaction-status?reference=${encodeURIComponent(req.checkoutRequestId)}`];
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { Authorization: `Basic ${cfg.token}` }, signal: AbortSignal.timeout(10_000), cache: "no-store" });
      if (res.status === 404) continue;
      const body = (await res.json().catch(() => ({}))) as { data?: { status?: string } };
      const status = String(body.data?.status ?? "").toLowerCase();
      if (status === "success" || status === "completed") return (await settleStk(orderId, req.checkoutRequestId, "success")) === "paid" ? "paid" : "waiting";
      if (["failed", "cancelled", "timeout"].includes(status)) {
        await settleStk(orderId, req.checkoutRequestId, status);
        return "failed";
      }
      return "waiting";
    } catch {
      // try the other address
    }
  }
  return "waiting";
}

/** The latest prompt for an order, for the order page. `waiting` = still open on the phone (under 2 minutes old). */
export async function latestStk(orderId: string) {
  const db = await getDb();
  const [req] = await db.select().from(stkRequests).where(eq(stkRequests.orderId, orderId)).orderBy(desc(stkRequests.createdAt)).limit(1);
  if (!req) return null;
  return { ...req, waiting: req.status === "sent" && Date.now() - req.createdAt.getTime() < 120_000 };
}

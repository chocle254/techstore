import { revalidatePath } from "next/cache";
import { z } from "zod";
import { callbackTokenOk, settleStk } from "@/lib/upesipay";

/**
 * UpesiPay calls this once a PIN prompt finishes. It sends no signature, so the URL carries a token
 * only our server can make (see lib/upesipay), and the ids must match a prompt we sent.
 * Always answer quickly with 200: UpesiPay waits at most 5 seconds.
 */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const orderId = url.searchParams.get("o") ?? "";
  if (!z.uuid().safeParse(orderId).success || !callbackTokenOk(orderId, url.searchParams.get("t") ?? "")) {
    return new Response("Forbidden", { status: 403 });
  }
  const body = (await req.json().catch(() => ({}))) as { checkout_request_id?: string; status?: string };
  if (body.checkout_request_id && body.status) {
    const result = await settleStk(orderId, String(body.checkout_request_id), String(body.status).toLowerCase());
    if (result === "paid") {
      revalidatePath(`/orders/${orderId}`);
      revalidatePath("/admin/orders");
    }
  }
  return Response.json({ received: true });
}

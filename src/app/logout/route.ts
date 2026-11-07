import { destroySession } from "@/lib/auth/session";
import { fromOurSite } from "@/lib/auth/same-origin";

/** Log out with a normal form post, so it works in every browser even if page scripts are stuck. */
export async function POST(req: Request) {
  if (!fromOurSite(req)) return new Response("Forbidden", { status: 403 });
  await destroySession();
  return new Response(null, { status: 303, headers: { Location: "/login", "Cache-Control": "no-store" } });
}

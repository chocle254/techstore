import { destroySession, json, sameOrigin } from "@/lib/server/session";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "Bad origin" }, 403);
  await destroySession();
  return json({ ok: true });
}

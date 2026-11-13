import { currentUser, json, publicUser } from "@/lib/server/session";

export async function GET() {
  const me = await currentUser();
  return me ? json({ me: publicUser(me) }) : json({ error: "login" }, 401);
}

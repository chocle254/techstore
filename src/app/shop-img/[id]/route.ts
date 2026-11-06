import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db";

/** Serves a product photo uploaded in admin. The link carries a version, so browsers may keep it forever. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return new Response("Not found", { status: 404 });
  const db = await getDb();
  const [row] = await db.select({ url: schema.products.imageUrl }).from(schema.products).where(eq(schema.products.id, id));
  const m = row?.url?.match(/^data:(image\/(?:webp|jpeg|png));base64,(.+)$/);
  if (!m) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(m[2], "base64"), {
    headers: { "Content-Type": m[1], "Cache-Control": "public, max-age=31536000, immutable" },
  });
}

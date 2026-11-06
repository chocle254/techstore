"use server";

import { revalidatePath, updateTag } from "next/cache";
import { SHOP_TAG } from "@/lib/shop";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth/guard";
import type { FormState } from "@/lib/auth/actions";

const { products, variants } = schema;

export async function updateVariantAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("boss");
  const parsed = z
    .object({
      variantId: z.uuid(),
      price: z.coerce.number().int().min(0).max(1_000_000),
      cost: z.coerce.number().int().min(0).max(1_000_000),
      lowStockAt: z.coerce.number().int().min(0).max(100_000),
      isActive: z.literal("on").optional(),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Prices must be whole shillings." };
  const { variantId, price, cost, lowStockAt, isActive } = parsed.data;
  const db = await getDb();
  const [before] = await db.select().from(variants).where(eq(variants.id, variantId));
  if (!before) return { error: "Size not found." };
  await db.update(variants).set({ price, cost, lowStockAt, isActive: isActive === "on" }).where(eq(variants.id, variantId));
  await audit(user.id, "price_changed", "variant", variantId, {
    from: { price: before.price, cost: before.cost, lowStockAt: before.lowStockAt, isActive: before.isActive },
    to: { price, cost, lowStockAt, isActive: isActive === "on" },
  });
  revalidatePath("/admin", "layout");
  updateTag(SHOP_TAG);
  return { ok: "Saved." };
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/^jonwin\s+/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

export async function saveProductAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("boss");
  const parsed = z
    .object({
      productId: z.uuid().optional().or(z.literal("")),
      name: z.string().trim().min(2).max(60),
      description: z.string().trim().max(500).default(""),
      batchLitres: z.coerce.number().min(1).max(1000).default(25),
      isActive: z.literal("on").optional(),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Give the product a name." };
  const { productId, name, description, batchLitres, isActive } = parsed.data;
  const db = await getDb();
  const values = { name, description, batchSizeMl: Math.round(batchLitres * 1000), isActive: productId ? isActive === "on" : true };
  if (productId) {
    await db.update(products).set(values).where(eq(products.id, productId));
    await audit(user.id, "product_updated", "product", productId, values);
  } else {
    const slug = slugify(name) || "product";
    const [row] = await db.insert(products).values({ ...values, slug }).onConflictDoNothing().returning({ id: products.id });
    if (!row) return { error: "A product with a similar name already exists." };
    await audit(user.id, "product_created", "product", row.id, values);
  }
  revalidatePath("/admin", "layout");
  updateTag(SHOP_TAG);
  return { ok: "Saved." };
}

export async function addSizeAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("boss");
  const parsed = z
    .object({ productId: z.uuid(), sizeMl: z.coerce.number().int().min(50).max(100_000) })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Pick a size." };
  const db = await getDb();
  const [row] = await db.insert(variants).values({ ...parsed.data, price: 0 }).onConflictDoNothing().returning({ id: variants.id });
  if (!row) return { error: "That size already exists." };
  await audit(user.id, "size_added", "variant", row.id, parsed.data);
  revalidatePath("/admin", "layout");
  updateTag(SHOP_TAG);
  return { ok: "Size added. Set its price." };
}

// Photos arrive already shrunk in the browser (about 1000px wide), as a data URL.
const PHOTO = /^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+/=]+$/;

export async function saveProductPhotoAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("boss");
  const productId = String(form.get("productId") ?? "");
  const photo = String(form.get("photo") ?? "");
  if (!z.uuid().safeParse(productId).success) return { error: "Product not found." };
  const remove = form.get("remove") === "1";
  if (!remove && (!PHOTO.test(photo) || photo.length > 900_000)) return { error: "Pick a photo first (JPG, PNG or WebP)." };
  const db = await getDb();
  await db.update(products).set({ imageUrl: remove ? null : photo }).where(eq(products.id, productId));
  await audit(user.id, remove ? "product_photo_removed" : "product_photo_set", "product", productId, {});
  revalidatePath("/", "layout");
  updateTag(SHOP_TAG);
  return { ok: remove ? "Photo removed." : "Photo saved. It's on the shop now." };
}

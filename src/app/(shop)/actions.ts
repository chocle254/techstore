"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { audit } from "@/lib/audit";
import { hashPassword, passwordProblem } from "@/lib/auth/password";
import { createSession, getCurrentUser } from "@/lib/auth/session";
import { normalizePhone } from "@/lib/phone";
import { rateLimit } from "@/lib/ratelimit";
import { pendingRatings } from "@/lib/shop";

const { users, variants, products, deliveryAreas, sales, saleItems, stockMovements, orders, ratings } = schema;

export type ShopState = { error?: string; ok?: string; field?: string } | undefined;

const coord = z
  .string()
  .trim()
  .regex(/^-?\d{1,3}\.\d{1,8}$/)
  .optional()
  .or(z.literal(""));

const orderSchema = z.object({
  items: z
    .array(z.object({ variantId: z.uuid(), qty: z.number().int().min(1).max(500) }))
    .min(1, "Your cart is empty.")
    .max(30),
  areaId: z.uuid({ message: "Choose your delivery area." }),
  address: z.string().trim().min(3, "Tell the rider how to find you.").max(300),
  lat: coord,
  lng: coord,
  contactName: z.string().trim().min(2, "Enter your name.").max(80),
  contactPhone: z.string().trim().max(20),
  payMethod: z.enum(["mpesa", "cod"]),
  note: z.string().trim().max(300).optional(),
  // Only when creating an account at checkout.
  password: z.string().max(200).optional(),
  email: z.string().trim().max(120).optional(),
  saveLocation: z.literal("on").optional(),
  ratings: z.record(z.string(), z.coerce.number().int().min(0).max(5)).optional(),
});

/** Turns the checkout form into an order. Creates the customer's account first if they aren't logged in. */
export async function placeOrderAction(_: ShopState, form: FormData): Promise<ShopState> {
  let items: unknown;
  try {
    items = JSON.parse(String(form.get("items") ?? "[]"));
  } catch {
    return { error: "Your cart couldn't be read. Refresh the page and try again." };
  }
  const ratingEntries = [...form.entries()].filter(([k]) => k.startsWith("rate:")).map(([k, v]) => [k.slice(5), String(v)]);
  const parsed = orderSchema.safeParse({
    ...Object.fromEntries([...form.entries()].filter(([k]) => !k.startsWith("rate:") && k !== "items")),
    items,
    ratings: Object.fromEntries(ratingEntries),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  const input = parsed.data;

  const phone = normalizePhone(input.contactPhone);
  if (!phone) return { error: "Enter a Kenyan phone number, like 0712 345 678.", field: "contactPhone" };
  if (!(await rateLimit("checkout", phone))) return { error: "Too many orders in a short time. Please wait a little and try again." };

  const db = await getDb();
  let me = await getCurrentUser();

  // New customer: create the account now so they can follow the order.
  if (!me) {
    const password = input.password ?? "";
    const problem = passwordProblem(password);
    if (problem) return { error: problem, field: "password" };
    const email = input.email ? input.email.toLowerCase() : null;
    if (email && !z.email().safeParse(email).success) return { error: "That email address doesn't look right.", field: "email" };
    if (!(await rateLimit("signup", phone))) return { error: "Too many sign-ups from here. Try again later." };

    const [existing] = await db.select({ id: users.id, hasPassword: users.passwordHash }).from(users).where(eq(users.phone, phone));
    if (existing?.hasPassword) return { error: "This phone number already has an account. Log in first, then place your order.", field: "login" };
    if (existing) {
      return {
        error: "We already have this phone number from a shop visit. Ask JonWin Clean to set up your online account, then log in.",
        field: "login",
      };
    }
    if (email) {
      const [taken] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
      if (taken) return { error: "That email is already used by another account.", field: "email" };
    }
    const [created] = await db
      .insert(users)
      .values({ name: input.contactName, phone, email, passwordHash: await hashPassword(password), roles: ["customer"] })
      .returning({ id: users.id });
    await audit(created.id, "signup", "user", created.id, { via: "checkout" });
    await createSession(created.id);
    me = {
      id: created.id,
      name: input.contactName,
      phone,
      email,
      roles: ["customer"],
      isTrusted: false,
      mustChangePassword: false,
    };
  }

  if (input.payMethod === "cod" && !me.isTrusted) return { error: "Cash on delivery is for our regular customers. Please pay by M-Pesa." };

  const [area] = await db.select().from(deliveryAreas).where(and(eq(deliveryAreas.id, input.areaId), eq(deliveryAreas.isActive, true)));
  if (!area) return { error: "We don't deliver to that area any more. Choose another." };

  const qtyByVariant = new Map<string, number>();
  for (const i of input.items) qtyByVariant.set(i.variantId, (qtyByVariant.get(i.variantId) ?? 0) + i.qty);
  const rows = await db
    .select({ id: variants.id, price: variants.price, cost: variants.cost, active: variants.isActive, productActive: products.isActive })
    .from(variants)
    .innerJoin(products, eq(products.id, variants.productId))
    .where(inArray(variants.id, [...qtyByVariant.keys()]));
  if (rows.length !== qtyByVariant.size || rows.some((r) => !r.active || !r.productActive || r.price <= 0)) {
    return { error: "Something in your cart is no longer for sale. Remove it and try again." };
  }
  const lines = rows.map((r) => ({ variantId: r.id, qty: qtyByVariant.get(r.id)!, unitPrice: r.price, unitCost: r.cost }));
  const subtotal = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
  const total = subtotal + area.fee;

  // Ratings for the last delivery, if the customer gave any.
  const toRate = await pendingRatings(me.id);
  const ratingRows =
    toRate && input.ratings
      ? toRate.products
          .map((p) => ({ productId: p.id, stars: input.ratings![p.id] ?? 0 }))
          .filter((r) => r.stars >= 1 && r.stars <= 5)
          .map((r) => ({ ...r, orderId: toRate.orderId, customerId: me!.id }))
      : [];

  const customerId = me.id;
  const order = await db.transaction(async (tx) => {
    const [sale] = await tx
      .insert(sales)
      .values({
        channel: "online",
        customerId,
        paymentMethod: input.payMethod,
        subtotal,
        deliveryFee: area.fee,
        total,
        note: input.note || null,
      })
      .returning({ id: sales.id, receiptNo: sales.receiptNo });
    await tx.insert(saleItems).values(lines.map((l) => ({ ...l, saleId: sale.id })));
    await tx.insert(stockMovements).values(
      lines.map((l) => ({ variantId: l.variantId, delta: -l.qty, reason: "sale" as const, refId: sale.id, createdBy: customerId })),
    );
    const [o] = await tx
      .insert(orders)
      .values({
        saleId: sale.id,
        customerId,
        payMethod: input.payMethod,
        areaId: area.id,
        areaName: area.name,
        deliveryFee: area.fee,
        address: input.address,
        lat: input.lat || null,
        lng: input.lng || null,
        contactName: input.contactName,
        contactPhone: phone,
        note: input.note || null,
      })
      .returning({ id: orders.id });
    if (ratingRows.length) await tx.insert(ratings).values(ratingRows).onConflictDoNothing();
    if (input.saveLocation === "on") {
      await tx
        .update(users)
        .set({ areaId: area.id, locationLabel: input.address, locationLat: input.lat || null, locationLng: input.lng || null })
        .where(eq(users.id, customerId));
    }
    await audit(customerId, "order_placed", "order", o.id, { orderNo: sale.receiptNo, total, payMethod: input.payMethod }, tx);
    return o;
  });

  revalidatePath("/admin/orders");
  redirect(`/orders/${order.id}?new=1`);
}

/** The customer types the M-Pesa confirmation code after paying. Staff check it before marking the order paid. */
const signupSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(80),
  phone: z.string().trim().max(20),
  email: z.string().trim().max(120).optional(),
  password: z.string().max(200),
  next: z.string().max(200).optional(),
});

export async function signupAction(_: ShopState, form: FormData): Promise<ShopState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Fill in the form." };
  const { name, password } = parsed.data;
  const phone = normalizePhone(parsed.data.phone);
  if (!phone) return { error: "Enter a Kenyan phone number, like 0712 345 678." };
  const email = parsed.data.email ? parsed.data.email.toLowerCase() : null;
  if (email && !z.email().safeParse(email).success) return { error: "That email address doesn't look right." };
  const problem = passwordProblem(password);
  if (problem) return { error: problem };
  if (!(await rateLimit("signup", phone))) return { error: "Too many sign-ups from here. Try again later." };

  const db = await getDb();
  const [existing] = await db.select({ hasPassword: users.passwordHash }).from(users).where(eq(users.phone, phone));
  if (existing?.hasPassword) return { error: "This phone number already has an account. Log in instead." };
  if (existing) return { error: "We already have this phone number from a shop visit. Ask JonWin Clean to set up your online account." };
  if (email) {
    const [taken] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
    if (taken) return { error: "That email is already used by another account." };
  }
  const [created] = await db
    .insert(users)
    .values({ name, phone, email, passwordHash: await hashPassword(password), roles: ["customer"] })
    .returning({ id: users.id });
  await audit(created.id, "signup", "user", created.id, { via: "signup" });
  await createSession(created.id);
  const next = parsed.data.next;
  redirect(next && /^\/(?!\/)[\w\-/?=&.]*$/.test(next) ? next : "/account");
}

export async function saveLocationAction(_: ShopState, form: FormData): Promise<ShopState> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  const parsed = z
    .object({ areaId: z.uuid().optional().or(z.literal("")), address: z.string().trim().max(300), lat: coord, lng: coord })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Check the location and try again." };
  const { areaId, address, lat, lng } = parsed.data;
  const db = await getDb();
  await db
    .update(users)
    .set({ areaId: areaId || null, locationLabel: address || null, locationLat: lat || null, locationLng: lng || null })
    .where(eq(users.id, me.id));
  await audit(me.id, "location_saved", "user", me.id);
  revalidatePath("/account");
  return { ok: "Saved. We'll fill this in for your next order." };
}

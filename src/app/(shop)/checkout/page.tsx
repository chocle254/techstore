import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getAreas, pendingRatings } from "@/lib/shop";
import { ShopFooter, ShopHeader } from "@/components/shop/chrome";
import { CheckoutForm } from "./checkout-form";

export const metadata = { title: "Checkout" };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const [user, areas] = await Promise.all([getCurrentUser(), getAreas()]);
  let saved: { areaId: string | null; address: string | null; lat: string | null; lng: string | null } | null = null;
  let toRate = null;
  if (user) {
    const db = await getDb();
    const [u] = await db
      .select({ areaId: schema.users.areaId, address: schema.users.locationLabel, lat: schema.users.locationLat, lng: schema.users.locationLng })
      .from(schema.users)
      .where(eq(schema.users.id, user.id));
    saved = u ?? null;
    toRate = await pendingRatings(user.id);
  }

  return (
    <>
      <ShopHeader />
      <main className="mx-3 mt-3 bg-jw-paper px-5 py-12 sm:px-10 lg:px-16 lg:py-16">
        <h1 className="text-[length:var(--step-head)]">Checkout</h1>
        <CheckoutForm
          user={user ? { name: user.name, phone: user.phone, isTrusted: user.isTrusted } : null}
          areas={areas}
          saved={saved}
          toRate={toRate}
        />
      </main>
      <ShopFooter />
    </>
  );
}

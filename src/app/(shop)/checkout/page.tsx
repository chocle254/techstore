import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getAreas, pendingRatings } from "@/lib/shop";
import { ShopFooter, ShopHeader, StepBar } from "@/components/shop/chrome";
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
      <main className="mx-auto w-full max-w-6xl flex-1 px-3 pt-6 sm:px-4">
        <StepBar at={1} />
        <h1 className="mt-8 text-[length:var(--step-head)]">Checkout</h1>
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

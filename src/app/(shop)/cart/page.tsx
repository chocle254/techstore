import { getAreas, getCatalog } from "@/lib/shop";
import { ShopFooter, ShopHeader, StepBar } from "@/components/shop/chrome";
import { CartView } from "./cart-view";

export const metadata = { title: "Cart" };
export const dynamic = "force-dynamic";

export default async function CartPage() {
  const [catalog, areas] = await Promise.all([getCatalog(), getAreas()]);
  const fresh = catalog.flatMap((p) => p.sizes.map((s) => ({ variantId: s.variantId, price: s.price, name: p.name })));
  const deliveryFrom = areas.length ? Math.min(...areas.map((a) => a.fee)) : null;
  return (
    <>
      <ShopHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-3 pt-6 sm:px-4">
        <StepBar at={0} />
        <h1 className="mt-8 text-[length:var(--step-head)]">Your cart</h1>
        <CartView fresh={fresh} deliveryFrom={deliveryFrom} />
      </main>
      <ShopFooter />
    </>
  );
}

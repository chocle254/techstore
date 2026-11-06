import { getCatalog } from "@/lib/shop";
import { ShopFooter, ShopHeader } from "@/components/shop/chrome";
import { CartView } from "./cart-view";

export const metadata = { title: "Cart" };
export const dynamic = "force-dynamic";

export default async function CartPage() {
  const catalog = await getCatalog();
  const fresh = catalog.flatMap((p) => p.sizes.map((s) => ({ variantId: s.variantId, price: s.price, name: p.name })));
  return (
    <>
      <ShopHeader />
      <main className="mx-3 mt-3 bg-jw-paper px-5 py-12 sm:px-10 lg:px-16 lg:py-16">
        <h1 className="text-[length:var(--step-head)]">Your cart</h1>
        <CartView fresh={fresh} />
      </main>
      <ShopFooter />
    </>
  );
}

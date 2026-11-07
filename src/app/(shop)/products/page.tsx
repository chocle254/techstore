import { getCatalog, getRatingSummary } from "@/lib/shop";
import { toGridItems } from "@/lib/shop-grid";
import { ShopFooter, ShopHeader } from "@/components/shop/chrome";
import { ProductGrid } from "@/components/shop/product-grid";

export const metadata = { title: "All products" };

/** Every product and size on one page: what the Products tab in the bottom bar opens. */
export default async function ProductsPage({ searchParams }: PageProps<"/products">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 60) : "";
  const size = typeof sp.size === "string" ? Number(sp.size) : undefined;
  const [catalog, ratings] = await Promise.all([getCatalog(), getRatingSummary()]);
  const items = toGridItems(catalog, ratings);

  return (
    <>
      <ShopHeader q={q} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-3 pt-6 sm:px-4">
        <div className="mb-4 flex items-end justify-between gap-3">
          <h1 className="text-[length:var(--step-head)]">{q ? "Search results" : "All products"}</h1>
          <p className="text-sm text-jw-soft">{items.filter((i) => i.price > 0).length} items</p>
        </div>
        {items.length === 0 ? (
          <p className="jw-clay p-10 text-center">Our products are being added. Please check back soon.</p>
        ) : (
          <ProductGrid key={q} items={items} initialQuery={q} initialSize={size} />
        )}
      </main>
      <ShopFooter />
    </>
  );
}

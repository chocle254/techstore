import type { CatalogProduct, RatingSummary } from "./shop";
import type { GridItem } from "@/components/shop/product-grid";

/** One card per product size, with the per-litre saving against that product's smallest priced size. */
export function toGridItems(catalog: CatalogProduct[], ratings: RatingSummary): GridItem[] {
  return catalog.flatMap((p) => {
    const priced = p.sizes.filter((s) => s.price > 0);
    const perL = (s: { price: number; sizeMl: number }) => s.price / s.sizeMl;
    const base = priced.length ? perL(priced.reduce((a, b) => (a.sizeMl < b.sizeMl ? a : b))) : 0;
    const best = priced.length > 1 ? priced.reduce((a, b) => (perL(a) <= perL(b) ? a : b)).variantId : null;
    return p.sizes.map((s) => ({
      productId: p.id,
      slug: p.slug,
      name: p.name,
      description: p.description,
      variantId: s.variantId,
      sizeMl: s.sizeMl,
      price: s.price,
      saving: s.price > 0 && base > 0 ? Math.max(0, 1 - perL(s) / base) : 0,
      bestValue: s.variantId === best,
      rating: ratings[p.id] ?? null,
    }));
  });
}

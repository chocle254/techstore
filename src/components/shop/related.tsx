"use client";

import { useCart } from "@/lib/cart";
import { ProductCard, type GridItem } from "./product-grid";

export function RelatedProducts({ items }: { items: GridItem[] }) {
  const lines = useCart();
  return (
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
      {items.map((i) => (
        <ProductCard key={i.variantId} item={i} inCart={lines.find((l) => l.variantId === i.variantId)?.qty ?? 0} />
      ))}
    </div>
  );
}

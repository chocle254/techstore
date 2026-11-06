"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { cart, useCart } from "@/lib/cart";
import { ksh, sizeLabel } from "@/lib/format";
import { CardBottle, short, tileFor } from "./tiles";
import { Icon, Stars } from "./icons";

export type GridItem = {
  productId: string;
  slug: string;
  name: string;
  description: string;
  variantId: string;
  sizeMl: number;
  price: number;
  /** Share saved per litre compared with this product's smallest size, 0–1. */
  saving: number;
  bestValue: boolean;
  rating: { avg: number; count: number } | null;
};

export function QtyStepper({ variantId, qty, label, size = "md" }: { variantId: string; qty: number; label: string; size?: "sm" | "md" }) {
  const h = size === "sm" ? "h-9 w-9" : "h-11 w-11";
  return (
    <div className="jw-well flex items-center justify-between rounded-full p-0.5" role="group" aria-label={`Quantity of ${label}`}>
      <button type="button" className={`jw-press grid ${h} place-items-center rounded-full bg-jw-paper shadow-sm`} onClick={() => cart.setQty(variantId, qty - 1)} aria-label={qty === 1 ? "Remove" : "One fewer"}>
        <Icon name={qty === 1 ? "trash" : "minus"} className="h-4 w-4" />
      </button>
      <span className="min-w-8 text-center font-bold tabular-nums" aria-live="polite">
        {qty}
      </span>
      <button type="button" className={`jw-press grid ${h} place-items-center rounded-full bg-jw-ground text-white shadow-sm`} onClick={() => cart.setQty(variantId, qty + 1)} aria-label="One more">
        <Icon name="plus" className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ProductCard({ item, inCart }: { item: GridItem; inCart: number }) {
  const href = `/p/${item.slug}?size=${item.sizeMl}`;
  const label = `${short(item.name)} ${sizeLabel(item.sizeMl)}`;
  const perL = Math.round((item.price * 1000) / item.sizeMl);
  return (
    <article className="jw-clay jw-clay-hover group flex flex-col p-2.5 sm:p-3">
      <Link href={href} className="relative block overflow-hidden rounded-2xl" style={{ background: tileFor(item.slug) }}>
        <div className="flex aspect-square items-end justify-center pb-4 transition-transform duration-300 ease-out group-hover:scale-[1.04]">
          <CardBottle slug={item.slug} sizeMl={item.sizeMl} height={item.sizeMl >= 10000 ? 118 : 128} />
        </div>
        <span className="absolute top-2 right-2 rounded-full bg-white/80 px-2 py-0.5 text-xs font-bold tabular-nums backdrop-blur">{sizeLabel(item.sizeMl)}</span>
        {item.bestValue && item.price > 0 && <span className="jw-badge absolute top-2 left-2 bg-jw-ink text-white">Best value</span>}
        {!item.bestValue && item.saving >= 0.05 && item.price > 0 && (
          <span className="jw-badge absolute top-2 left-2 bg-jw-ground text-white">Save {Math.round(item.saving * 100)}%/L</span>
        )}
      </Link>
      <div className="flex flex-1 flex-col px-1 pt-3">
        <h3 className="line-clamp-2 text-sm leading-snug font-semibold">
          <Link href={href} className="hover:text-jw-deep">
            {short(item.name)}, {sizeLabel(item.sizeMl)}
          </Link>
        </h3>
        <div className="mt-1 flex h-4 items-center gap-1 text-xs text-jw-soft">
          {item.rating ? (
            <>
              <Stars value={item.rating.avg} />
              <span>({item.rating.count})</span>
            </>
          ) : (
            <span className="flex items-center gap-1">
              <Icon name="leaf" className="h-3.5 w-3.5 text-jw-mpesa" /> Family-made
            </span>
          )}
        </div>
        {item.price > 0 ? (
          <p className="mt-2">
            <span className="text-lg font-extrabold tabular-nums">{ksh(item.price)}</span>
            <span className="block text-xs text-jw-soft tabular-nums">{ksh(perL)} per litre</span>
          </p>
        ) : (
          <p className="mt-2 text-sm font-semibold text-jw-soft">Price coming soon</p>
        )}
        <div className="mt-auto pt-3">
          {item.price <= 0 ? (
            <button type="button" disabled className="jw-btn-quiet min-h-10 w-full text-sm">
              Coming soon
            </button>
          ) : inCart > 0 ? (
            <QtyStepper variantId={item.variantId} qty={inCart} label={label} size="sm" />
          ) : (
            <button
              type="button"
              className="jw-btn min-h-10 w-full px-3 text-sm"
              onClick={() =>
                cart.add({ variantId: item.variantId, productId: item.productId, slug: item.slug, name: item.name, sizeMl: item.sizeMl, price: item.price })
              }
            >
              <Icon name="cart" className="h-4 w-4" /> Add to cart
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

type Sort = "popular" | "low" | "high" | "value";

/** The shop listing: filter by product and size, sort, and add straight from the card. */
export function ProductGrid({ items, initialQuery = "", initialSize }: { items: GridItem[]; initialQuery?: string; initialSize?: number }) {
  const lines = useCart();
  const sizes = useMemo(() => [...new Set(items.map((i) => i.sizeMl))].sort((a, b) => a - b), [items]);
  const products = useMemo(() => [...new Map(items.map((i) => [i.productId, { id: i.productId, name: short(i.name) }])).values()], [items]);
  const [size, setSize] = useState<number | null>(initialSize && sizes.includes(initialSize) ? initialSize : null);
  const [product, setProduct] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>("popular");
  const [query, setQuery] = useState(initialQuery.trim());

  const shown = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    const list = items.filter((i) => {
      if (size && i.sizeMl !== size) return false;
      if (product && i.productId !== product) return false;
      const hay = `${i.name} ${i.description} ${sizeLabel(i.sizeMl)} ${i.sizeMl / 1000} litre litres`.toLowerCase();
      return words.every((w) => hay.includes(w.replace(/l$/, "")));
    });
    const perL = (i: GridItem) => (i.price > 0 ? i.price / i.sizeMl : Infinity);
    const priced = (i: GridItem) => (i.price > 0 ? 0 : 1);
    if (sort === "low") list.sort((a, b) => priced(a) - priced(b) || a.price - b.price);
    if (sort === "high") list.sort((a, b) => priced(a) - priced(b) || b.price - a.price);
    if (sort === "value") list.sort((a, b) => perL(a) - perL(b));
    if (sort === "popular") list.sort((a, b) => priced(a) - priced(b) || (b.rating?.count ?? 0) - (a.rating?.count ?? 0));
    return list;
  }, [items, size, product, sort, query]);

  return (
    <div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="jw-scroll-x -mx-3 flex gap-2 overflow-x-auto px-3 py-1" role="group" aria-label="Filter by product">
          <button type="button" className="jw-chip" aria-pressed={!product} onClick={() => setProduct(null)}>
            All
          </button>
          {products.map((p) => (
            <button key={p.id} type="button" className="jw-chip" aria-pressed={product === p.id} onClick={() => setProduct(product === p.id ? null : p.id)}>
              {p.name}
            </button>
          ))}
        </div>
        <label className="flex shrink-0 items-center gap-2 text-sm">
          <span className="text-jw-soft">Sort</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="jw-chip appearance-none pr-4 outline-none">
            <option value="popular">Most popular</option>
            <option value="value">Best value per litre</option>
            <option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option>
          </select>
        </label>
      </div>

      <div className="jw-scroll-x -mx-3 mt-2 flex gap-2 overflow-x-auto px-3 py-1" role="group" aria-label="Filter by size">
        <span className="flex shrink-0 items-center pr-1 text-sm text-jw-soft">Size</span>
        <button type="button" className="jw-chip" aria-pressed={size === null} onClick={() => setSize(null)}>
          Any
        </button>
        {sizes.map((s) => (
          <button key={s} type="button" className="jw-chip tabular-nums" aria-pressed={size === s} onClick={() => setSize(size === s ? null : s)}>
            {sizeLabel(s)}
          </button>
        ))}
      </div>

      {query && (
        <p className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <span>
            {shown.length} {shown.length === 1 ? "result" : "results"} for <b>“{query}”</b>
          </span>
          <button type="button" className="jw-link" onClick={() => setQuery("")}>
            Clear search
          </button>
        </p>
      )}

      {shown.length === 0 ? (
        <div className="jw-clay mt-5 p-10 text-center">
          <p className="font-semibold">Nothing matches that.</p>
          <button
            type="button"
            className="jw-btn-quiet mt-4"
            onClick={() => {
              setQuery("");
              setSize(null);
              setProduct(null);
            }}
          >
            Show everything
          </button>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5" aria-live="polite">
          {shown.map((i) => (
            <ProductCard key={i.variantId} item={i} inCart={lines.find((l) => l.variantId === i.variantId)?.qty ?? 0} />
          ))}
        </div>
      )}
    </div>
  );
}

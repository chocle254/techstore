"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { Bottle, liquidFor, type Liquid } from "./bottle";
import { cart, useCart } from "@/lib/cart";
import { ksh, sizeLabel } from "@/lib/format";

type Size = { variantId: string; sizeMl: number; price: number };
type Product = { id: string; slug: string; name: string; sizes: Size[] };

const perLitre = (price: number, ml: number) => Math.round((price * 1000) / ml);

/** The six containers on one baseline at true scale. Real radio buttons underneath, so it works by keyboard. */
export function SizeScale({
  sizes,
  value,
  onChange,
  liquid,
  fullHeight,
  muted,
  name,
  scaleClass = "[--jw-full:100px] min-[400px]:[--jw-full:130px] sm:[--jw-full:200px] lg:[--jw-full:230px]",
}: {
  scaleClass?: string;
  sizes: number[];
  value: number;
  onChange: (ml: number) => void;
  liquid: Liquid;
  fullHeight: number;
  muted: string;
  name: string;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="sr-only">Bottle size</legend>
      <div className={`flex items-end justify-between gap-1 overflow-x-auto pb-1 sm:gap-3 ${scaleClass}`}>
        {sizes.map((ml) => {
          const on = ml === value;
          return (
            <label
              key={ml}
              className="group flex min-w-11 shrink-0 cursor-pointer flex-col items-center justify-end gap-2 py-2 transition-transform duration-200 active:scale-95 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-jw-ink"
            >
              <input type="radio" name={name} value={ml} checked={on} onChange={() => onChange(ml)} className="sr-only" />
              <span className="transition-transform duration-300 ease-out group-hover:-translate-y-1">
                <Bottle sizeMl={ml} liquid={liquid} fullHeight={fullHeight} muted={on ? undefined : muted} />
              </span>
              <span
                className={`min-w-12 px-1.5 py-0.5 text-center text-[0.9375rem] tabular-nums ${
                  on ? "bg-jw-ink font-semibold text-jw-ground" : "text-jw-ink"
                }`}
              >
                {sizeLabel(ml)}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Home page: pick a size once and see every product's price at that size. */
export function SizeExplorer({ products }: { products: Product[] }) {
  const allSizes = [...new Set(products.flatMap((p) => p.sizes.map((s) => s.sizeMl)))].sort((a, b) => a - b);
  const [size, setSize] = useState(allSizes.includes(5000) ? 5000 : (allSizes[0] ?? 0));
  const name = useId();
  if (!allSizes.length) return null;
  const liquid = liquidFor("liquid-soap");

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-end lg:gap-16">
      <div className="min-w-0">
        <SizeScale sizes={allSizes} value={size} onChange={setSize} liquid={liquid} fullHeight={220} muted="#f6c9a6" name={name} />
      </div>
      <div aria-live="polite">
        <p className="text-[length:var(--step-lead)] leading-snug font-medium">{sizeLabel(size)}, every product</p>
        <ul className="mt-5 space-y-4">
          {products.map((p) => {
            const s = p.sizes.find((x) => x.sizeMl === size);
            return (
              <li key={p.id} className="flex items-baseline justify-between gap-4">
                <Link href={`/p/${p.slug}?size=${size}`} className="underline decoration-2 underline-offset-4 hover:decoration-jw-ground">
                  {p.name.replace(/^JonWin\s+/, "")}
                </Link>
                <span className="text-right tabular-nums">
                  {!s ? (
                    <span className="text-jw-soft">Not in this size</span>
                  ) : s.price > 0 ? (
                    <>
                      {ksh(s.price)}
                      <span className="block text-[length:var(--step-small)] text-jw-soft">{ksh(perLitre(s.price, size))} a litre</span>
                    </>
                  ) : (
                    <span className="text-jw-soft">Price coming soon</span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/** Product page: choose size and quantity, add to cart. */
export function ProductBuy({ product, initialSize }: { product: Product; initialSize?: number }) {
  const sizes = product.sizes;
  const start = sizes.find((s) => s.sizeMl === initialSize && s.price > 0) ?? sizes.find((s) => s.price > 0) ?? sizes[0];
  const [ml, setMl] = useState(start?.sizeMl ?? 0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const lines = useCart();
  const name = useId();
  const liquid = liquidFor(product.slug);
  const current = sizes.find((s) => s.sizeMl === ml);
  const inCart = lines.find((l) => l.variantId === current?.variantId)?.qty ?? 0;
  if (!current) return <p>This product has no sizes for sale yet.</p>;

  const add = () => {
    cart.add({ variantId: current.variantId, productId: product.id, slug: product.slug, name: product.name, sizeMl: ml, price: current.price }, qty);
    setAdded(true);
    setQty(1);
  };

  return (
    <div className="space-y-8">
      <SizeScale
        sizes={sizes.map((s) => s.sizeMl)}
        value={ml}
        onChange={(v) => {
          setMl(v);
          setAdded(false);
        }}
        liquid={liquid}
        fullHeight={200}
        muted="#f6c9a6"
        name={name}
        scaleClass="[--jw-full:100px] min-[400px]:[--jw-full:130px] sm:[--jw-full:170px] lg:[--jw-full:150px] xl:[--jw-full:185px]"
      />

      <div aria-live="polite" className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        {current.price > 0 ? (
          <>
            <p className="text-[length:var(--step-lead)] leading-none font-semibold tabular-nums">{ksh(current.price)}</p>
            <p className="text-jw-soft tabular-nums">
              {sizeLabel(ml)} · {ksh(perLitre(current.price, ml))} a litre
            </p>
          </>
        ) : (
          <p className="text-[length:var(--step-lead)]">The price for {sizeLabel(ml)} is coming soon.</p>
        )}
      </div>

      {current.price > 0 && (
        <div className="flex flex-wrap items-stretch gap-3">
          <div className="flex items-stretch bg-jw-paper" role="group" aria-label="Quantity">
            <button type="button" className="jw-press w-12 text-2xl" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="One fewer">
              −
            </button>
            <output className="flex w-12 items-center justify-center text-lg tabular-nums" aria-live="polite">
              {qty}
            </output>
            <button type="button" className="jw-press w-12 text-2xl" onClick={() => setQty((q) => Math.min(500, q + 1))} aria-label="One more">
              +
            </button>
          </div>
          <button type="button" onClick={add} className="jw-btn flex-1 sm:flex-none">
            {qty > 1 ? `Add ${qty} · ${ksh(current.price * qty)}` : "Add to cart"}
          </button>
        </div>
      )}

      {(added || inCart > 0) && (
        <p className="flex flex-wrap items-baseline gap-x-4 gap-y-2" role="status">
          <span>
            {inCart} × {sizeLabel(ml)} in your cart.
          </span>
          <Link href="/cart" className="font-semibold underline decoration-2 underline-offset-4">
            Go to cart
          </Link>
        </p>
      )}
    </div>
  );
}

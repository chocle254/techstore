"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cart, useCart } from "@/lib/cart";
import { ksh, sizeLabel } from "@/lib/format";
import { CardBottle, tileFor } from "./tiles";
import { Icon, Stars } from "./icons";

type Size = { variantId: string; sizeMl: number; price: number };
type Product = { id: string; slug: string; name: string; sizes: Size[] };

const perLitre = (price: number, ml: number) => Math.round((price * 1000) / ml);

/** Picture, size choice, quantity and buttons for one product. The picture follows the chosen size. */
export function ProductBuy({
  product,
  initialSize,
  rating,
  deliveryFrom,
}: {
  product: Product;
  initialSize?: number;
  rating: { avg: number; count: number } | null;
  deliveryFrom: number | null;
}) {
  const router = useRouter();
  const sizes = product.sizes;
  const start = sizes.find((s) => s.sizeMl === initialSize && s.price > 0) ?? sizes.find((s) => s.price > 0) ?? sizes[0];
  const [ml, setMl] = useState(start?.sizeMl ?? 0);
  const [qty, setQty] = useState(1);
  const lines = useCart();
  const current = sizes.find((s) => s.sizeMl === ml);
  const priced = sizes.filter((s) => s.price > 0);
  const smallest = priced.length ? priced.reduce((a, b) => (a.sizeMl < b.sizeMl ? a : b)) : null;
  if (!current) return <p className="jw-clay p-6">This product has no sizes for sale yet.</p>;

  const inCart = lines.find((l) => l.variantId === current.variantId)?.qty ?? 0;
  const saving = smallest && current.price > 0 ? 1 - current.price / current.sizeMl / (smallest.price / smallest.sizeMl) : 0;
  const line = { variantId: current.variantId, productId: product.id, slug: product.slug, name: product.name, sizeMl: ml, price: current.price };

  return (
    <div className="grid gap-4 md:grid-cols-[1.1fr_1fr] md:gap-6">
      {/* Picture */}
      <div className="md:sticky md:top-36 md:self-start">
        <div className="jw-clay p-3">
          <div className="relative flex aspect-square items-end justify-center overflow-hidden rounded-[1.25rem] pb-10" style={{ background: tileFor(product.slug) }}>
            <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-white/40 blur-3xl" aria-hidden />
            <div key={ml} className="jw-rise relative">
              <CardBottle slug={product.slug} sizeMl={ml} height={ml >= 10000 ? 250 : 270} />
            </div>
            <span className="absolute top-3 right-3 rounded-full bg-white/80 px-3 py-1 text-sm font-bold tabular-nums backdrop-blur">{sizeLabel(ml)}</span>
            {saving >= 0.05 && <span className="jw-badge absolute top-3 left-3 bg-jw-ground px-2.5 py-1 text-white">Save {Math.round(saving * 100)}% a litre</span>}
          </div>
          <div className="jw-scroll-x mt-3 flex gap-2 overflow-x-auto" aria-hidden>
            {sizes.map((s) => (
              <button
                key={s.variantId}
                type="button"
                tabIndex={-1}
                onClick={() => setMl(s.sizeMl)}
                className={`flex h-16 w-16 shrink-0 items-end justify-center rounded-xl pb-1.5 ring-2 transition ${s.sizeMl === ml ? "ring-jw-ground" : "ring-transparent opacity-70 hover:opacity-100"}`}
                style={{ background: tileFor(product.slug) }}
              >
                <CardBottle slug={product.slug} sizeMl={s.sizeMl} height={44} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Buy box */}
      <div className="jw-clay p-5 sm:p-7">
        <h1 className="text-[length:var(--step-head)]">{product.name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-jw-soft">
          {rating ? (
            <span className="flex items-center gap-1.5">
              <Stars value={rating.avg} className="h-4 w-4" />
              <b className="text-jw-ink">{rating.avg.toFixed(1)}</b> ({rating.count} {rating.count === 1 ? "rating" : "ratings"})
            </span>
          ) : (
            <span>No ratings yet</span>
          )}
          <span className="flex items-center gap-1 text-jw-mpesa">
            <Icon name="leaf" className="h-4 w-4" /> Made fresh by our family
          </span>
        </div>

        <div className="mt-5 border-y border-jw-ink/5 py-4" aria-live="polite">
          {current.price > 0 ? (
            <>
              <p className="text-3xl font-extrabold tabular-nums">{ksh(current.price)}</p>
              <p className="mt-1 text-sm text-jw-soft tabular-nums">
                {sizeLabel(ml)} · {ksh(perLitre(current.price, ml))} per litre
              </p>
            </>
          ) : (
            <p className="text-lg font-semibold">The {sizeLabel(ml)} price is coming soon.</p>
          )}
        </div>

        <fieldset className="mt-5">
          <legend className="jw-label">Choose a size</legend>
          <div className="grid grid-cols-3 gap-2">
            {sizes.map((s) => {
              const on = s.sizeMl === ml;
              return (
                <label
                  key={s.variantId}
                  className={`relative flex cursor-pointer flex-col items-center rounded-2xl px-2 py-2.5 text-center transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-jw-ground/30 ${
                    on ? "bg-jw-ink text-white shadow-[0_8px_18px_-8px_rgb(22_24_29/0.6)]" : "jw-well hover:bg-jw-ground/10"
                  }`}
                >
                  <input
                    type="radio"
                    name="size"
                    value={s.sizeMl}
                    checked={on}
                    onChange={() => {
                      setMl(s.sizeMl);
                      setQty(1);
                    }}
                    className="sr-only"
                  />
                  <span className="font-bold tabular-nums">{sizeLabel(s.sizeMl)}</span>
                  <span className={`text-xs tabular-nums ${on ? "text-white/75" : "text-jw-soft"}`}>{s.price > 0 ? ksh(s.price) : "Soon"}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {current.price > 0 && (
          <>
            <div className="mt-5 flex items-center gap-3">
              <span className="jw-label mb-0">Quantity</span>
              <div className="jw-well flex items-center rounded-full p-0.5" role="group" aria-label="Quantity">
                <button type="button" className="jw-press grid h-10 w-10 place-items-center rounded-full bg-jw-paper shadow-sm" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="One fewer">
                  <Icon name="minus" className="h-4 w-4" />
                </button>
                <output className="min-w-10 text-center font-bold tabular-nums">{qty}</output>
                <button type="button" className="jw-press grid h-10 w-10 place-items-center rounded-full bg-jw-paper shadow-sm" onClick={() => setQty((q) => Math.min(500, q + 1))} aria-label="One more">
                  <Icon name="plus" className="h-4 w-4" />
                </button>
              </div>
              {qty > 1 && <span className="text-sm font-semibold tabular-nums">= {ksh(current.price * qty)}</span>}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                className="jw-btn-quiet"
                onClick={() => {
                  cart.add(line, qty);
                  setQty(1);
                }}
              >
                <Icon name="cart" className="h-5 w-5" /> Add to cart
              </button>
              <button
                type="button"
                className="jw-btn"
                onClick={() => {
                  cart.add(line, qty);
                  router.push("/checkout");
                }}
              >
                Buy now
              </button>
            </div>
            {inCart > 0 && (
              <p className="mt-3 text-center text-sm text-jw-soft">
                {inCart} × {sizeLabel(ml)} already in your cart.{" "}
                <Link href="/cart" className="jw-link">
                  View cart
                </Link>
              </p>
            )}
          </>
        )}

        <ul className="jw-well mt-6 space-y-3 p-4 text-sm">
          <li className="flex gap-3">
            <Icon name="truck" className="h-5 w-5 shrink-0 text-jw-deep" />
            <span>
              <b>Delivery</b>{" "}
              {deliveryFrom === null ? "areas are being set up" : `from ${deliveryFrom > 0 ? ksh(deliveryFrom) : "free"}, one fee per order`}
            </span>
          </li>
          <li className="flex gap-3">
            <Icon name="shield" className="h-5 w-5 shrink-0 text-jw-mpesa" />
            <span>
              <b>Pay by M-Pesa</b> after you order. Regular customers can pay cash on delivery.
            </span>
          </li>
          <li className="flex gap-3">
            <Icon name="clock" className="h-5 w-5 shrink-0 text-jw-deep" />
            <span>
              <b>Track it</b> on your order page, from packing to your gate.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}

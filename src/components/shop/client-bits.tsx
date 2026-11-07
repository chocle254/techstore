"use client";

import { short } from "./tiles";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ADDED_EVENT, cartCount, cartTotal, useCart, type CartLine } from "@/lib/cart";
import { ksh, sizeLabel } from "@/lib/format";
import { Icon } from "./icons";
import { Bottle, liquidFor } from "./bottle";

function useAddedPulse() {
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    const on = () => setPulse((p) => p + 1);
    window.addEventListener(ADDED_EVENT, on);
    return () => window.removeEventListener(ADDED_EVENT, on);
  }, []);
  return pulse;
}

function Badge({ n, pulse }: { n: number; pulse: number }) {
  if (!n) return null;
  return (
    <span
      key={pulse}
      className="jw-pop absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-jw-ground px-1 text-[0.6875rem] font-bold text-white tabular-nums ring-2 ring-white"
    >
      {n > 99 ? "99+" : n}
    </span>
  );
}

export function CartButton() {
  const lines = useCart();
  const n = cartCount(lines);
  const pulse = useAddedPulse();
  return (
    <Link
      href="/cart"
      className="relative flex min-h-11 items-center gap-2 rounded-full bg-night px-3.5 text-sm font-semibold text-white sm:px-4"
      aria-label={n ? `Cart, ${n} ${n === 1 ? "item" : "items"}, ${ksh(cartTotal(lines))}` : "Cart, empty"}
    >
      <Icon name="cart" className="h-5 w-5" />
      <span className="hidden tabular-nums sm:inline">{n ? ksh(cartTotal(lines)) : "Cart"}</span>
      <Badge n={n} pulse={pulse} />
    </Link>
  );
}

export function SearchBox({ defaultValue = "" }: { defaultValue?: string }) {
  return (
    <form action="/" role="search" className="relative">
      <label htmlFor="shop-q" className="sr-only">
        Search products
      </label>
      <Icon name="search" className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-jw-soft" />
      <input
        id="shop-q"
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder="Search soap, Jik, Dettol…"
        className="h-11 w-full rounded-full border border-jw-ink/5 bg-jw-paper/90 pr-24 pl-11 text-base outline-none placeholder:text-jw-soft/80 focus:border-jw-ground focus:ring-4 focus:ring-jw-ground/15"
        style={{ boxShadow: "inset 0 2px 4px rgb(60 35 15 / .05)" }}
      />
      <button type="submit" className="absolute top-1 right-1 bottom-1 rounded-full bg-jw-ground px-4 text-sm font-semibold text-white active:scale-95">
        Search
      </button>
    </form>
  );
}

/** Phone-only tab bar: home, products, cart, account. Hidden at checkout so the form has the room. */
export function BottomNav({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const lines = useCart();
  const pulse = useAddedPulse();
  if (pathname.startsWith("/checkout")) return null;
  const tabs = [
    { href: "/", label: "Home", icon: "home" as const, on: pathname === "/" },
    { href: "/#shop", label: "Products", icon: "grid" as const, on: pathname.startsWith("/p/") },
    { href: "/cart", label: "Cart", icon: "cart" as const, on: pathname === "/cart", badge: cartCount(lines) },
    { href: signedIn ? "/account" : "/login", label: signedIn ? "Account" : "Log in", icon: "user" as const, on: pathname.startsWith("/account") || pathname === "/login" },
  ];
  return (
    <nav aria-label="Shop" className="fixed inset-x-2 bottom-2 z-40 md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="jw-glass grid grid-cols-4 rounded-3xl px-1 py-1">
        {tabs.map((t) => (
          <Link
            key={t.label}
            href={t.href}
            onClick={(e) => {
              // On the home page "/#shop" is the same address after the first tap, so the browser does nothing. Scroll ourselves.
              if (t.href === "/#shop" && pathname === "/") {
                e.preventDefault();
                document.getElementById("shop")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }
            }}
            aria-current={t.on ? "page" : undefined}
            className={`relative flex flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[0.6875rem] font-semibold ${t.on ? "bg-jw-ground/10 text-jw-deep" : "text-jw-ink/70"}`}
          >
            <span className="relative">
              <Icon name={t.icon} className="h-6 w-6" />
              {t.badge !== undefined && <Badge n={t.badge} pulse={pulse} />}
            </span>
            {t.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

/** "Added to cart" note that pops up after any add, with a way straight to the cart. */
export function CartToast() {
  const [item, setItem] = useState<(Omit<CartLine, "qty"> & { qty: number; key: number }) | null>(null);
  const lines = useCart();
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const on = (e: Event) => {
      setItem({ ...(e as CustomEvent).detail, key: Date.now() });
      clearTimeout(timer);
      timer = setTimeout(() => setItem(null), 4000);
    };
    window.addEventListener(ADDED_EVENT, on);
    return () => {
      window.removeEventListener(ADDED_EVENT, on);
      clearTimeout(timer);
    };
  }, []);
  if (!item) return null;
  return (
    <div className="pointer-events-none fixed inset-x-2 bottom-24 z-50 flex justify-center md:bottom-6" role="status" aria-live="polite">
      <div key={item.key} className="jw-glass jw-rise pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-3xl p-3 pr-3">
        <span className="grid h-12 w-12 shrink-0 place-items-end justify-center rounded-2xl bg-jw-well pb-1">
          <Bottle sizeMl={Math.min(item.sizeMl, 1000)} liquid={liquidFor(item.slug)} fullHeight={70} />
        </span>
        <span className="min-w-0 flex-1 text-sm">
          <span className="flex items-center gap-1 font-bold text-jw-mpesa">
            <Icon name="check" className="h-4 w-4" /> Added to cart
          </span>
          <span className="block truncate">
            {item.qty} × {short(item.name)} {sizeLabel(item.sizeMl)}
          </span>
        </span>
        <Link href="/cart" className="jw-btn min-h-10 px-4 text-sm">
          Cart ({cartCount(lines)})
        </Link>
        <button type="button" onClick={() => setItem(null)} className="grid h-8 w-8 place-items-center rounded-full text-jw-soft hover:bg-jw-ink/5" aria-label="Close">
          <Icon name="x" className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

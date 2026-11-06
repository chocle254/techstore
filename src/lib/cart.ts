"use client";

import { useSyncExternalStore } from "react";

// The cart lives in the browser, so it survives a refresh and needs no account.
// Prices are shown from the catalog and checked again on the server when the order is placed.
export type CartLine = { variantId: string; productId: string; slug: string; name: string; sizeMl: number; price: number; qty: number };

const KEY = "jw_cart_v1";
const listeners = new Set<() => void>();
let cache: CartLine[] | null = null;
const EMPTY: CartLine[] = [];

function read(): CartLine[] {
  if (cache) return cache;
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    cache = Array.isArray(raw) ? raw.filter((l) => l && typeof l.variantId === "string" && l.qty > 0) : [];
  } catch {
    cache = [];
  }
  return cache!;
}

function write(lines: CartLine[]) {
  cache = lines;
  try {
    localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    // Private mode or full storage: the cart still works for this visit.
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useCart() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

/** Fired on window after something is added, so the shop can show a small "added" note. */
export const ADDED_EVENT = "jw:cart-added";

export const cart = {
  add(line: Omit<CartLine, "qty">, qty = 1) {
    const lines = read();
    queueMicrotask(() => window.dispatchEvent(new CustomEvent(ADDED_EVENT, { detail: { ...line, qty } })));
    const found = lines.find((l) => l.variantId === line.variantId);
    write(
      found
        ? lines.map((l) => (l.variantId === line.variantId ? { ...l, ...line, qty: Math.min(500, l.qty + qty) } : l))
        : [...lines, { ...line, qty }],
    );
  },
  setQty(variantId: string, qty: number) {
    write(qty <= 0 ? read().filter((l) => l.variantId !== variantId) : read().map((l) => (l.variantId === variantId ? { ...l, qty: Math.min(500, qty) } : l)));
  },
  /** Refresh names and prices from the latest catalog and drop sizes that are gone. */
  sync(fresh: { variantId: string; price: number; name: string }[]) {
    const byId = new Map(fresh.map((f) => [f.variantId, f]));
    const next = read()
      .filter((l) => byId.has(l.variantId) && byId.get(l.variantId)!.price > 0)
      .map((l) => ({ ...l, price: byId.get(l.variantId)!.price, name: byId.get(l.variantId)!.name }));
    if (JSON.stringify(next) !== JSON.stringify(read())) write(next);
  },
  clear() {
    write([]);
  },
};

export const cartCount = (lines: CartLine[]) => lines.reduce((s, l) => s + l.qty, 0);
export const cartTotal = (lines: CartLine[]) => lines.reduce((s, l) => s + l.qty * l.price, 0);

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { cartCount, useCart } from "@/lib/cart";

export function CartLink({ className = "" }: { className?: string }) {
  const n = cartCount(useCart());
  return (
    <Link href="/cart" className={className} aria-label={n ? `Cart, ${n} ${n === 1 ? "bottle" : "bottles"}` : "Cart, empty"}>
      Cart{n > 0 && <span className="tabular-nums"> ({n})</span>}
    </Link>
  );
}

/** Turns on the entrance motion and plays it as each [data-reveal] block scrolls into view. */
export function Reveal() {
  const pathname = usePathname();
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("jw-js");
    const els = document.querySelectorAll<HTMLElement>("[data-reveal]");
    if (!("IntersectionObserver" in window)) {
      els.forEach((e) => e.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }),
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [pathname]);
  return null;
}

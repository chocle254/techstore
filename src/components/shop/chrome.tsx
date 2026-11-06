import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { CartLink } from "./client-bits";

/** The plain bar used on every shop page except the home page, which sets its own. */
export async function ShopHeader() {
  const user = await getCurrentUser();
  return (
    <header className="mx-3 mt-3 flex min-h-16 flex-wrap items-center justify-between gap-x-6 gap-y-2 bg-jw-paper px-4 py-3 sm:px-6">
      <Link href="/" className="text-[length:var(--step-lead)] font-medium tracking-tight">
        JonWin Clean
      </Link>
      <nav aria-label="Shop" className="flex flex-wrap items-center gap-x-5 gap-y-1">
        <Link href="/#products" className="jw-link no-underline hover:underline">
          Products
        </Link>
        <Link href={user ? "/account" : "/login"} className="jw-link no-underline hover:underline">
          {user ? "My orders" : "Log in"}
        </Link>
        <CartLink className="jw-link font-semibold" />
      </nav>
    </header>
  );
}

export const CREDITS = [
  { title: "Water seller in Kenya", by: "Anavilahn", href: "https://commons.wikimedia.org/wiki/File:Water_seller_in_kenya.jpg" },
  { title: "Morning laundry work", by: "Johnnybam", href: "https://commons.wikimedia.org/wiki/File:Morning_Laundry_Work.jpg" },
  { title: "Washing line", by: "Boli99", href: "https://commons.wikimedia.org/wiki/File:Washing_line.jpg" },
  { title: "Kenol, Murang'a market", by: "Robertwhisps", href: "https://commons.wikimedia.org/w/index.php?curid=64203534" },
];

/** A single quiet line to close every shop page, with the picture credits under it. */
export function ShopFooter({ credits = false }: { credits?: boolean }) {
  return (
    <footer className="mx-4 mt-[20svh] pb-8 text-[length:var(--step-small)] sm:mx-6 lg:mt-[30svh]">
      <div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-baseline sm:gap-6">
        <p className="text-jw-soft">JonWin Clean, a family business</p>
        <nav aria-label="Policies" className="flex flex-wrap gap-x-6 gap-y-1">
          <Link href="/terms" className="jw-link">
            Terms
          </Link>
          <Link href="/delivery" className="jw-link">
            Delivery &amp; refunds
          </Link>
          <Link href="/login" className="jw-link">
            Staff log in
          </Link>
        </nav>
        <p className="text-jw-soft sm:text-right">
          © {new Date().getFullYear()} ·{" "}
          <Link href="/privacy" className="jw-link text-jw-ink">
            Privacy
          </Link>
        </p>
      </div>
      {credits && (
        <p className="mt-4 max-w-4xl text-jw-soft">
          Pictures from Wikimedia Commons, CC BY-SA 4.0:{" "}
          {CREDITS.map((c, i) => (
            <span key={c.href}>
              <a href={c.href} className="jw-link text-jw-ink" rel="noopener">
                {c.title}
              </a>{" "}
              by {c.by}
              {i < CREDITS.length - 1 ? "; " : "."}
            </span>
          ))}{" "}
          <a href="https://creativecommons.org/licenses/by-sa/4.0/" className="jw-link text-jw-ink" rel="noopener">
            Licence
          </a>
          .
        </p>
      )}
    </footer>
  );
}

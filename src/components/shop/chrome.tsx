import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getCatalog } from "@/lib/shop";
import { CartButton, SearchBox } from "./client-bits";
import { Icon } from "./icons";
import { short } from "./tiles";
import { Logo } from "./logo";

/** Sticky frosted header on every shop page: logo, search, account, cart, then the product row. */
export async function ShopHeader({ q = "" }: { q?: string }) {
  const [user, catalog] = await Promise.all([getCurrentUser(), getCatalog()]);
  return (
    <header className="sticky top-0 z-40 px-2 pt-2 sm:px-4">
      <div className="jw-glass mx-auto max-w-7xl rounded-3xl px-3 py-2.5 sm:px-5">
        <div className="flex items-center gap-3 sm:gap-5">
          <Logo />
          <div className="hidden flex-1 md:block">
            <SearchBox defaultValue={q} />
          </div>
          <nav aria-label="Account and cart" className="ml-auto flex items-center gap-1 sm:gap-2">
            <Link
              href={user ? "/account" : "/login"}
              className="flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold hover:bg-jw-ink/5"
            >
              <Icon name="user" className="h-5 w-5" />
              <span className="hidden sm:inline">{user ? `Hi, ${user.name.split(" ")[0]}` : "Log in"}</span>
            </Link>
            <CartButton />
          </nav>
        </div>
        <div className="mt-2 md:hidden">
          <SearchBox defaultValue={q} />
        </div>
        {catalog.length > 0 && (
          <nav aria-label="Products" className="jw-scroll-x -mx-1 mt-2 hidden gap-1 md:flex overflow-x-auto px-1 pb-0.5 text-sm">
            <Link href="/#shop" className="rounded-full px-3 py-1.5 font-semibold whitespace-nowrap text-jw-deep hover:bg-jw-ground/10">
              All products
            </Link>
            {catalog.map((p) => (
              <Link key={p.id} href={`/p/${p.slug}`} className="rounded-full px-3 py-1.5 font-medium whitespace-nowrap text-jw-ink/80 hover:bg-jw-ink/5">
                {short(p.name)}
              </Link>
            ))}
            <Link href="/#delivery" className="rounded-full px-3 py-1.5 font-medium whitespace-nowrap text-jw-ink/80 hover:bg-jw-ink/5">
              Delivery fees
            </Link>
            <Link href="/#help" className="rounded-full px-3 py-1.5 font-medium whitespace-nowrap text-jw-ink/80 hover:bg-jw-ink/5">
              Help
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}

/** Cart → Delivery → Payment → Done, shown on the cart, checkout and order pages. */
export function StepBar({ at }: { at: 0 | 1 | 2 | 3 }) {
  const steps = ["Cart", "Delivery & details", "Pay", "Done"];
  return (
    <ol className="mx-auto flex max-w-xl items-center gap-2 text-xs font-semibold sm:text-sm" aria-label="Order steps">
      {steps.map((s, i) => (
        <li key={s} className="flex flex-1 items-center gap-2" aria-current={i === at ? "step" : undefined}>
          <span
            className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs ${
              i < at ? "bg-jw-ink text-white" : i === at ? "bg-jw-ground text-white shadow-[0_6px_14px_-6px_rgb(247_107_21/0.9)]" : "bg-jw-paper text-jw-soft shadow-[0_0_0_1px_rgb(0_0_0/0.08)]"
            }`}
          >
            {i < at ? <Icon name="check" className="h-3.5 w-3.5" /> : i + 1}
          </span>
          <span className={`hidden min-[420px]:inline ${i === at ? "text-jw-ink" : "text-jw-soft"}`}>{s}</span>
          {i < steps.length - 1 && <span className={`h-0.5 flex-1 rounded-full ${i < at ? "bg-jw-ink" : "bg-jw-ink/10"}`} aria-hidden />}
        </li>
      ))}
    </ol>
  );
}

export const CREDITS = [
  { title: "Water seller in Kenya", by: "Anavilahn", href: "https://commons.wikimedia.org/wiki/File:Water_seller_in_kenya.jpg" },
  { title: "Morning laundry work", by: "Johnnybam", href: "https://commons.wikimedia.org/wiki/File:Morning_Laundry_Work.jpg" },
  { title: "Washing line", by: "Boli99", href: "https://commons.wikimedia.org/wiki/File:Washing_line.jpg" },
  { title: "Kenol, Murang'a market", by: "Robertwhisps", href: "https://commons.wikimedia.org/w/index.php?curid=64203534" },
];

export function ShopFooter({ credits = false }: { credits?: boolean }) {
  return (
    <footer className="mt-16 bg-jw-ink pb-28 text-white/80 md:pb-10">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 pt-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-lg font-extrabold text-white">
            JonWin<span className="text-jw-ground">.</span> Clean
          </p>
          <p className="mt-3 max-w-[30ch] text-sm">Cleaning liquids made by our family in small batches, delivered to your door.</p>
        </div>
        <FooterCol title="Shop" links={[["All products", "/#shop"], ["Your cart", "/cart"], ["Delivery fees", "/#delivery"]]} />
        <FooterCol title="Your account" links={[["My orders", "/account"], ["Create an account", "/signup"], ["Staff log in", "/login"]]} />
        <FooterCol title="Help" links={[["Questions", "/#help"], ["Delivery & refunds", "/delivery"], ["Terms", "/terms"], ["Privacy", "/privacy"]]} />
      </div>
      <div className="mx-auto mt-10 flex max-w-7xl flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 pt-6 text-xs text-white/60">
        <p>© {new Date().getFullYear()} JonWin Clean, a family business</p>
        <p className="flex items-center gap-2">
          <span className="rounded-md bg-jw-mpesa px-2 py-0.5 font-bold text-white">M-PESA</span> Cash on delivery for regulars
        </p>
      </div>
      {credits && (
        <p className="mx-auto mt-4 max-w-7xl px-5 text-xs text-white/50">
          Photos from Wikimedia Commons, CC BY-SA 4.0:{" "}
          {CREDITS.map((c, i) => (
            <span key={c.href}>
              <a href={c.href} className="underline underline-offset-2 hover:text-white" rel="noopener">
                {c.title}
              </a>{" "}
              by {c.by}
              {i < CREDITS.length - 1 ? "; " : "."}
            </span>
          ))}
        </p>
      )}
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <nav aria-label={title}>
      <p className="text-sm font-bold text-white">{title}</p>
      <ul className="mt-3 space-y-2 text-sm">
        {links.map(([label, href]) => (
          <li key={href}>
            <Link href={href} className="hover:text-white hover:underline">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

import Image from "next/image";
import Link from "next/link";
import { getAreas, getCatalog, getRatingSummary } from "@/lib/shop";
import { toGridItems } from "@/lib/shop-grid";
import { ksh } from "@/lib/format";
import { ShopFooter, ShopHeader } from "@/components/shop/chrome";
import { ProductGrid } from "@/components/shop/product-grid";
import { CardBottle, ProductPic, short, tileFor } from "@/components/shop/tiles";
import { BottleGroup, liquidFor } from "@/components/shop/bottle";
import { Icon, type IconName } from "@/components/shop/icons";

// Prices and areas change in the admin, so this page is built per visit.
export const dynamic = "force-dynamic";

const PERKS: { icon: IconName; title: string; text: string }[] = [
  { icon: "truck", title: "Delivered to you", text: "One fixed fee per area" },
  { icon: "shield", title: "Pay by M-Pesa", text: "Or cash, for regulars" },
  { icon: "leaf", title: "Made by our family", text: "Fresh 25-litre batches" },
  { icon: "clock", title: "Track your order", text: "From packing to your gate" },
];

const STEPS: { icon: IconName; title: string; text: string }[] = [
  { icon: "cart", title: "Fill your cart", text: "Pick products and sizes. No account needed to browse." },
  { icon: "pin", title: "Tell us where", text: "Choose your area and pin your gate on the map." },
  { icon: "shield", title: "Pay by M-Pesa", text: "Pay to our till and type the code. Regulars can pay cash." },
  { icon: "truck", title: "We bring it", text: "A rider calls you, then brings the bottles to your door." },
];

const FAQ: [string, string][] = [
  ["Who makes JonWin?", "A family. We cook every product ourselves in 25-litre batches and fill the bottles at home."],
  ["Which sizes can I buy?", "500ml, 1 litre, 2, 5, 10 and 20 litres. The bigger the container, the less you pay per litre."],
  ["How do I pay?", "By M-Pesa to our till. After you order, the order page shows the till number and a box for your M-Pesa code."],
  ["Can I pay when the bottles arrive?", "Yes, once you are one of our regular customers. We switch on cash on delivery for you after your first orders."],
  ["What does delivery cost?", "A fixed fee for your area, listed on this page and added at checkout before you pay."],
  ["Do I need an account?", "You make one at checkout with your phone number and a password. It lets you follow orders and see every payment."],
  ["I forgot my password.", "Use “Forgot password” on the log in page if you gave an email, or call us and we will reset it."],
  ["Is it safe for children?", "Keep every bottle closed and out of reach. Never mix bleach with other cleaners: the fumes are dangerous."],
  ["Can I return a bottle?", "If something arrives damaged or wrong, tell us within 24 hours. The delivery and refund page has the details."],
];

export default async function ShopHome({ searchParams }: PageProps<"/">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 60) : "";
  const size = typeof sp.size === "string" ? Number(sp.size) : undefined;
  const [catalog, areas, ratings] = await Promise.all([getCatalog(), getAreas(), getRatingSummary()]);
  const items = toGridItems(catalog, ratings);
  const priced = items.filter((i) => i.price > 0);
  const from = priced.length ? Math.min(...priced.map((i) => i.price)) : 0;
  const maxSaving = Math.max(0, ...items.map((i) => i.saving));
  const cheapestFee = areas.length ? Math.min(...areas.map((a) => a.fee)) : null;

  return (
    <>
      <ShopHeader q={q} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-3 pt-4 sm:px-4">
        {!q && (
          <>
            {/* Hero banner and two promo tiles */}
            <section className="grid gap-3 lg:grid-cols-[2fr_1fr] lg:gap-4" aria-labelledby="hero-title">
              <div
                className="relative isolate overflow-hidden rounded-[2rem] text-white"
                style={{ background: "linear-gradient(125deg, #ff8a3d 0%, #f76b15 45%, #c2410c 100%)", boxShadow: "0 30px 60px -30px rgb(194 65 12 / .7)" }}
              >
                <Image
                  src="/shop/morning-laundry-work.jpg"
                  alt=""
                  fill
                  priority
                  sizes="(min-width: 1024px) 66vw, 100vw"
                  className="-z-10 object-cover object-[70%_30%] opacity-35 mix-blend-multiply"
                />
                <div className="absolute -top-24 -right-24 -z-10 h-72 w-72 rounded-full bg-white/15 blur-2xl" aria-hidden />
                <div className="grid gap-6 p-6 sm:p-10 md:grid-cols-[1.2fr_1fr] md:items-end">
                  <div>
                    <p className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">
                      <Icon name="leaf" className="h-3.5 w-3.5" /> Family-made in Kenya
                    </p>
                    <h1 id="hero-title" className="mt-4 text-[length:var(--step-display)] !leading-[1.05] font-extrabold">
                      Clean home, fair price. Delivered.
                    </h1>
                    <p className="mt-4 max-w-[38ch] text-white/90">
                      Liquid soap, bleach, antiseptic and pine disinfectant, from a 500ml bottle to a 20-litre jerrycan.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <a href="#shop" className="jw-btn-dark">
                        Shop now <Icon name="arrow" className="h-4 w-4" />
                      </a>
                      <a href="#delivery" className="inline-flex min-h-12 items-center rounded-full bg-white/20 px-5 font-semibold backdrop-blur hover:bg-white/30">
                        Delivery fees
                      </a>
                    </div>
                  </div>
                  <div className="relative hidden h-64 md:block">
                    <div className="absolute inset-x-4 bottom-0 h-56">
                      <BottleGroup sizes={[500, 5000, 20000]} liquid={liquidFor("liquid-soap")} title="A 500ml bottle, a 5 litre jug and a 20 litre jerrycan of liquid soap" />
                    </div>
                    {from > 0 && (
                      <p className="absolute top-0 right-0 rounded-2xl border border-white/40 bg-white/25 px-4 py-2 text-sm backdrop-blur-md">
                        From <b className="text-lg tabular-nums">{ksh(from)}</b>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-1 lg:gap-4">
                <a href="#shop" className="jw-clay jw-clay-hover relative flex flex-col justify-between overflow-hidden p-4 sm:p-5" style={{ background: tileFor("bleach") }}>
                  <div>
                    <p className="jw-badge bg-jw-ink text-white">Bulk saver</p>
                    <p className="mt-2 text-base leading-tight font-extrabold sm:text-xl">
                      {maxSaving >= 0.05 ? `Save up to ${Math.round(maxSaving * 100)}% a litre` : "Buy bigger, pay less a litre"}
                    </p>
                    <p className="mt-1 text-xs text-jw-soft sm:text-sm">on 10 and 20 litre jerrycans</p>
                  </div>
                  <div className="mt-2 flex justify-end">
                    <CardBottle slug="bleach" sizeMl={20000} height={80} />
                  </div>
                </a>
                <Link href="/checkout" className="jw-clay jw-clay-hover relative flex flex-col justify-between overflow-hidden p-4 sm:p-5" style={{ background: "linear-gradient(160deg, #e2f6e9, #c3ebd2)" }}>
                  <div>
                    <p className="jw-badge bg-jw-mpesa text-white">M-Pesa</p>
                    <p className="mt-2 text-base leading-tight font-extrabold sm:text-xl">Pay in seconds with M-Pesa</p>
                    <p className="mt-1 text-xs text-jw-soft sm:text-sm">
                      {cheapestFee !== null ? `Delivery from ${cheapestFee > 0 ? ksh(cheapestFee) : "free"}` : "Delivery areas coming soon"}
                    </p>
                  </div>
                  <p className="mt-3 flex items-center gap-1 text-sm font-bold text-jw-mpesa">
                    Checkout <Icon name="arrow" className="h-4 w-4" />
                  </p>
                </Link>
              </div>
            </section>

            {/* Perks */}
            <ul className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {PERKS.map((p) => (
                <li key={p.title} className="jw-glass flex items-center gap-3 rounded-2xl p-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-jw-ground/10 text-jw-deep">
                    <Icon name={p.icon} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm leading-tight font-bold">{p.title}</span>
                    <span className="block text-xs text-jw-soft">{p.text}</span>
                  </span>
                </li>
              ))}
            </ul>

            {/* Shop by product */}
            {catalog.length > 0 && (
              <section className="mt-10" aria-labelledby="cats-title">
                <h2 id="cats-title" className="text-[length:var(--step-head)]">
                  Shop by product
                </h2>
                <ul className="jw-scroll-x -mx-3 mt-4 flex gap-3 overflow-x-auto px-3 pb-2 sm:grid sm:grid-cols-4 sm:overflow-visible">
                  {catalog.map((p) => {
                    const prices = p.sizes.filter((s) => s.price > 0).map((s) => s.price);
                    return (
                      <li key={p.id} className="w-40 shrink-0 sm:w-auto">
                        <Link href={`/p/${p.slug}`} className="jw-clay jw-clay-hover group flex h-full flex-col items-center p-3 text-center">
                          <span className="relative flex h-32 w-full items-end justify-center overflow-hidden rounded-2xl pb-3" style={{ background: tileFor(p.slug) }}>
                            <span className="transition-transform duration-300 group-hover:-translate-y-1">
                              <ProductPic slug={p.slug} sizeMl={1000} height={96} image={p.imageUrl} />
                            </span>
                          </span>
                          <span className="mt-3 text-sm font-bold">{short(p.name)}</span>
                          <span className="text-xs text-jw-soft">{prices.length ? `From ${ksh(Math.min(...prices))}` : "Coming soon"}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </>
        )}

        {/* The listing */}
        <section id="shop" className="mt-10 scroll-mt-32 md:scroll-mt-40" aria-labelledby="shop-title">
          <div className="mb-4 flex items-end justify-between gap-3">
            <h2 id="shop-title" className="text-[length:var(--step-head)]">
              {q ? "Search results" : "All products"}
            </h2>
            <p className="text-sm text-jw-soft">{items.filter((i) => i.price > 0).length} items in stock</p>
          </div>
          {items.length === 0 ? (
            <p className="jw-clay p-10 text-center">Our products are being added. Please check back soon.</p>
          ) : (
            <ProductGrid key={q} items={items} initialQuery={q} initialSize={size} />
          )}
        </section>

        {/* How it works and delivery fees */}
        <div className="mt-14 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <section className="jw-clay p-6 sm:p-8" aria-labelledby="how-title">
            <h2 id="how-title" className="text-[length:var(--step-head)]">
              How ordering works
            </h2>
            <ol className="mt-6 grid gap-4 sm:grid-cols-2">
              {STEPS.map((s, i) => (
                <li key={s.title} className="jw-well flex gap-3 p-4">
                  <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-jw-paper text-jw-deep shadow-sm">
                    <Icon name={s.icon} />
                    <span className="absolute -top-1.5 -left-1.5 grid h-5 w-5 place-items-center rounded-full bg-jw-ink text-[0.625rem] font-bold text-white">{i + 1}</span>
                  </span>
                  <span>
                    <span className="block font-bold">{s.title}</span>
                    <span className="block text-sm text-jw-soft">{s.text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <section id="delivery" className="jw-clay scroll-mt-32 md:scroll-mt-40 p-6 sm:p-8" aria-labelledby="fees-title">
            <h2 id="fees-title" className="flex items-center gap-2 text-[length:var(--step-head)]">
              Delivery fees
            </h2>
            <p className="mt-2 text-sm text-jw-soft">One fee per order, whatever you buy.</p>
            {areas.length ? (
              <ul className="mt-5 divide-y divide-jw-ink/5">
                {areas.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-4 py-2.5">
                    <span className="flex items-center gap-2 font-medium">
                      <Icon name="pin" className="h-4 w-4 text-jw-ground" />
                      {a.name}
                    </span>
                    <span className={`font-bold tabular-nums ${a.fee === 0 ? "text-jw-mpesa" : ""}`}>{a.fee > 0 ? ksh(a.fee) : "Free"}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="jw-well mt-5 p-4 text-sm">We are adding the areas we deliver to. Please check back soon.</p>
            )}
          </section>
        </div>

        {/* Questions */}
        <section id="help" className="mt-14 scroll-mt-32 md:scroll-mt-40" aria-labelledby="faq-title">
          <h2 id="faq-title" className="text-[length:var(--step-head)]">
            Questions
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {FAQ.map(([question, answer]) => (
              <details key={question} className="jw-clay group self-start px-5 py-1">
                <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-4 font-semibold">
                  {question}
                  <Icon name="chevron" className="jw-chevron h-5 w-5 shrink-0 text-jw-soft transition-transform" />
                </summary>
                <p className="pb-4 text-sm text-jw-soft">{answer}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <ShopFooter credits />
    </>
  );
}

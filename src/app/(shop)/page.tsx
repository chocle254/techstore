import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getAreas, getCatalog } from "@/lib/shop";
import { ksh, sizeLabel } from "@/lib/format";
import { Stage, type StagePhoto } from "@/components/shop/stage";
import { SizeExplorer } from "@/components/shop/size-picker";
import { CartLink } from "@/components/shop/client-bits";
import { ShopFooter } from "@/components/shop/chrome";

// Prices and areas change in the admin, so this page is built per visit.
export const dynamic = "force-dynamic";

const FIRST: StagePhoto[] = [
  { src: "/shop/water-seller-in-kenya.jpg", alt: "A man in Kenya wheels a bicycle loaded with yellow jerrycans along a dirt road", width: 787, height: 1400 },
  { src: "/shop/morning-laundry-work.jpg", alt: "A woman in an orange dress hangs bright washing on a line against a stone wall", width: 1050, height: 1400 },
];
const SECOND: StagePhoto[] = [
  { src: "/shop/washing-line.jpg", alt: "Blue and orange clothes drying on a line in a paved yard", width: 1400, height: 1050 },
  { src: "/shop/kenol-murang-a-kenya-market.jpg", alt: "Market stalls under umbrellas in Kenol, Murang'a", width: 1400, height: 788 },
];

const STEPS: { group: string; rows: [string, string][] }[] = [
  {
    group: "On this site",
    rows: [
      ["Choose products and sizes", "Cart"],
      ["Give your area and pin your gate", "Checkout"],
    ],
  },
  {
    group: "Paying",
    rows: [
      ["Pay to our M-Pesa till", "M-Pesa"],
      ["Or pay the rider in cash", "Regular customers"],
    ],
  },
  {
    group: "Delivery",
    rows: [
      ["We confirm and pack your bottles", "Order page"],
      ["A rider brings them to you", "Your area"],
    ],
  },
];

const FAQ: [string, string][] = [
  ["Who makes JonWin?", "A family. We cook every product ourselves in 25-litre batches and fill the bottles at home."],
  ["Which sizes can I buy?", "500ml, 1 litre, 2, 5, 10 and 20 litres. The bigger the container, the less you pay per litre."],
  ["How do I pay?", "By M-Pesa to our till. After you order, the order page shows the till number and a box for your M-Pesa code."],
  ["Can I pay when the bottles arrive?", "Yes, once you are one of our regular customers. We switch on cash on delivery for you after your first orders."],
  ["What does delivery cost?", "A fixed fee for your area, shown in the list on this page and added at checkout before you pay."],
  ["Do I need an account?", "You make one at checkout with your phone number and a password. It lets you follow orders and see every payment."],
  ["I forgot my password.", "Use “Forgot password” on the log in page if you gave an email, or call us and we will reset it."],
  ["Why do you ask me to rate?", "When you order again, we ask how the last bottles were. It tells us which batch to make better."],
  ["Is it safe for children?", "Keep every bottle closed and out of reach. Never mix bleach with other cleaners: the fumes are dangerous."],
  ["Can I return a bottle?", "If something arrives damaged or wrong, tell us within 24 hours. The delivery and refund page has the details."],
];

export default async function ShopHome() {
  const [catalog, areas, user] = await Promise.all([getCatalog(), getAreas(), getCurrentUser()]);

  return (
    <>
      <main id="top">
        {/* First split: hero and price list beside the still photograph. */}
        <div className="grid gap-3 p-3 lg:grid-cols-2">
          <div className="relative order-first h-[38svh] lg:order-last lg:h-auto">
            <div className="sticky top-3 h-[38svh] lg:h-[calc(100svh-24px)]">
              <Stage
                group="a"
                photos={FIRST}
                priority
                bar={
                  <>
                    <span>Pay by M-Pesa</span>
                    <span>Delivered to your area</span>
                  </>
                }
              />
            </div>
          </div>

          <div className="relative z-10 min-w-0">
            <section
              data-stage="a:0"
              className="flex flex-col bg-jw-ground px-5 pt-5 pb-16 lg:min-h-[calc(100svh-24px)] text-center sm:px-10 lg:pt-6"
              aria-labelledby="hero-title"
            >
              <nav aria-label="Main" className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <Link href={user ? "/account" : "/login"} className="jw-link justify-self-start text-[0.9375rem]">
                  {user ? "My orders" : "Log in"}
                </Link>
                <Link href="/" className="text-[clamp(1.5rem,1.1rem+1.6vw,2.25rem)] leading-none font-medium tracking-tight">
                  JonWin Clean
                </Link>
                <CartLink className="jw-link justify-self-end text-[0.9375rem] font-semibold" />
              </nav>

              <div className="mx-auto mt-10 max-w-[34rem] lg:mt-[22svh]" data-reveal>
                <h1 id="hero-title" className="text-[length:var(--step-display)]">
                  Cleaning liquids, delivered
                </h1>
                <p className="mx-auto mt-8 max-w-[40ch]">
                  Liquid soap, bleach, antiseptic and pine disinfectant, cooked by our family in 25-litre batches and brought to your door
                  in anything from a 500ml bottle to a 20-litre jerrycan.
                </p>
                <a href="#products" className="jw-btn mt-9 w-full sm:w-auto">
                  Choose your bottles
                </a>
              </div>
            </section>

            {/* The price list, set like a printed menu card. */}
            <section id="products" data-stage="a:1" aria-labelledby="list-title" className="scroll-mt-4 px-2 py-24 sm:px-6 lg:py-32">
              <div className="jw-sheet mx-auto max-w-[640px] px-7 py-14 text-center sm:px-16" data-reveal>
                <h2 id="list-title" className="text-[length:var(--step-head)]">
                  The price list
                </h2>
                <p className="mt-3 text-[length:var(--step-small)] text-jw-soft">Per bottle, in Kenya shillings. Tap a product to order.</p>

                {catalog.length === 0 && <p className="mt-12">Our products are being added. Please check back soon.</p>}

                {catalog.map((p) => (
                  <div key={p.id} className="mx-auto mt-14 max-w-[420px]">
                    <h3 className="text-[length:var(--step-lead)]">
                      <Link href={`/p/${p.slug}`} className="jw-link decoration-jw-ground hover:decoration-jw-ink">
                        {p.name}
                      </Link>
                    </h3>
                    {p.description && <p className="mt-1 text-[length:var(--step-small)] text-jw-soft">{p.description}</p>}
                    <ul className="mt-5 space-y-3 text-left">
                      {p.sizes.map((s) => (
                        <li key={s.variantId}>
                          <Link href={`/p/${p.slug}?size=${s.sizeMl}`} className="group flex items-baseline justify-between gap-4 tabular-nums">
                            <span className="group-hover:underline group-hover:decoration-2 group-hover:underline-offset-4">{sizeLabel(s.sizeMl)}</span>
                            <span>{s.price > 0 ? ksh(s.price) : <span className="text-jw-soft">Soon</span>}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                <p className="mt-14 text-[length:var(--step-small)]">
                  Delivery is added at checkout,
                  <br />
                  at the fee for your area.
                </p>
              </div>
            </section>
          </div>
        </div>

        {/* The one full-width break: every size side by side, at true scale. */}
        <section aria-labelledby="sizes-title" className="mx-3 bg-jw-paper px-5 py-20 sm:px-10 lg:px-16 lg:py-28">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16" data-reveal>
            <h2 id="sizes-title" className="text-[length:var(--step-head)]">
              Every size, side by side
            </h2>
            <p className="max-w-[44ch] lg:pt-3">
              Drawn to scale, from the 500ml bottle to the 20-litre jerrycan. Tap a size to see what each product costs in it, and what that
              comes to per litre.
            </p>
          </div>
          <div className="mt-14">
            <SizeExplorer products={catalog} />
          </div>
        </section>

        {/* Second split: ordering, fees and answers beside the second photograph. */}
        <div className="mt-3 grid gap-3 px-3 lg:grid-cols-2">
          <div className="relative order-first h-[38svh] lg:h-auto">
            <div className="sticky top-3 h-[38svh] lg:h-[calc(100svh-24px)]">
              <Stage
                group="b"
                photos={SECOND}
                bar={
                  <>
                    <span>Orders confirmed on your order page</span>
                    <span>{areas.length ? `${areas.length} delivery ${areas.length === 1 ? "area" : "areas"}` : "Delivery areas coming soon"}</span>
                  </>
                }
              />
            </div>
          </div>

          <div className="relative z-10 min-w-0 bg-jw-ground px-5 sm:px-10">
            <section id="how" data-stage="b:0" aria-labelledby="how-title" className="scroll-mt-4 pt-14 pb-28 lg:pt-24 lg:pb-36">
              <div data-reveal>
                <h2 id="how-title" className="text-[length:var(--step-head)]">
                  How an order reaches you
                </h2>
                <p className="mt-5 max-w-[34ch]">
                  No forms before you shop. You make your account at checkout with your phone number, so you can follow the order.
                </p>
              </div>
              <div className="jw-slip mt-12 max-w-[30rem] px-6 pt-7 text-base sm:px-8" data-reveal>
                {STEPS.map((s) => (
                  <div key={s.group} className="mt-7 first:mt-0">
                    <h3 className="text-base font-semibold tracking-normal">{s.group}</h3>
                    <ul className="mt-2 space-y-2">
                      {s.rows.map(([what, where]) => (
                        <li key={what} className="flex flex-wrap items-baseline gap-x-2">
                          <span>{what}</span>
                          <span className="jw-dots" aria-hidden />
                          <span className="ml-auto text-right">{where}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                <p className="-mx-6 mt-7 flex min-h-11 items-center justify-between gap-4 bg-jw-ink px-6 py-2 text-jw-paper sm:-mx-8 sm:px-8">
                  <span>Your bottles at your door</span>
                  <span>Fee by area</span>
                </p>
              </div>
            </section>

            <section id="delivery" data-stage="b:1" aria-labelledby="fees-title" className="scroll-mt-4 pb-28 lg:pb-36">
              <div data-reveal>
                <h2 id="fees-title" className="text-[length:var(--step-head)]">
                  Delivery fees
                </h2>
                <p className="mt-5 max-w-[40ch]">One fee per order, whatever you buy. Choose your area at checkout.</p>
              </div>
              {areas.length ? (
                <ul className="mt-10 max-w-[30rem] space-y-[22px] text-[length:var(--step-lead)]" data-reveal>
                  {areas.map((a) => (
                    <li key={a.id} className="flex items-baseline justify-between gap-6 tabular-nums">
                      <span>{a.name}</span>
                      <span>{a.fee > 0 ? ksh(a.fee) : "Free"}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-10 max-w-[40ch] text-[length:var(--step-lead)]" data-reveal>
                  We are adding the areas we deliver to. Please check back soon.
                </p>
              )}
            </section>

            <section id="questions" data-stage="b:1" aria-labelledby="faq-title" className="scroll-mt-4 pb-24">
              <h2 id="faq-title" className="text-[length:var(--step-head)]" data-reveal>
                <span>Questions</span>
              </h2>
              <div className="mt-10 max-w-[46ch] space-y-5" data-reveal>
                {FAQ.map(([q, a]) => (
                  <p key={q}>
                    <span className="font-semibold">{q}</span> {a}
                  </p>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
      <ShopFooter credits />
    </>
  );
}

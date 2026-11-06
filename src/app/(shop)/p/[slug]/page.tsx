import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCatalog } from "@/lib/shop";
import { ksh, sizeLabel } from "@/lib/format";
import { ShopFooter, ShopHeader } from "@/components/shop/chrome";
import { Bottle, BottleGroup, liquidFor } from "@/components/shop/bottle";
import { ProductBuy } from "@/components/shop/size-picker";

export const dynamic = "force-dynamic";

// One picture of everyday cleaning in Kenya per product (credited in the home page footer).
const PHOTOS: Record<string, { src: string; alt: string; width: number; height: number; caption: string }> = {
  "liquid-soap": { src: "/shop/morning-laundry-work.jpg", alt: "A woman hangs bright washing on a line against a stone wall", width: 1050, height: 1400, caption: "Morning laundry. Photo: Johnnybam, CC BY-SA 4.0." },
  bleach: { src: "/shop/washing-line.jpg", alt: "Blue and orange clothes drying on a line in a paved yard", width: 1400, height: 1050, caption: "Washing day. Photo: Boli99, CC BY-SA 4.0." },
};
const DEFAULT_PHOTO = { src: "/shop/kenol-murang-a-kenya-market.jpg", alt: "Market stalls under umbrellas in Kenol, Murang'a", width: 1400, height: 788, caption: "Market day in Kenol, Murang'a. Photo: Robertwhisps, CC BY-SA 4.0." };

export async function generateMetadata({ params }: PageProps<"/p/[slug]">) {
  const { slug } = await params;
  const p = (await getCatalog()).find((x) => x.slug === slug);
  return p ? { title: p.name, description: p.description || `${p.name} from 500ml to 20 litres, delivered.` } : { title: "Not found" };
}

export default async function ProductPage({ params, searchParams }: PageProps<"/p/[slug]">) {
  const { slug } = await params;
  const { size } = await searchParams;
  const catalog = await getCatalog();
  const product = catalog.find((p) => p.slug === slug);
  if (!product) notFound();
  const others = catalog.filter((p) => p.id !== product.id);
  const liquid = liquidFor(product.slug);
  const biggest = Math.max(...product.sizes.map((s) => s.sizeMl));
  const priced = product.sizes.filter((s) => s.price > 0);
  const photo = PHOTOS[product.slug] ?? DEFAULT_PHOTO;
  const from = priced.length ? Math.min(...priced.map((s) => s.price)) : 0;

  return (
    <>
      <ShopHeader />
      <main className="grid gap-3 p-3 lg:grid-cols-2">
        {/* The product, drawn large on a white field. */}
        <div className="relative">
          <div className="flex h-[44svh] items-end justify-center bg-jw-paper px-6 pt-10 lg:sticky lg:top-3 lg:h-[calc(100svh-24px)]">
            <div className="h-full w-full max-w-[36rem] pt-6 pb-10 lg:pt-16 lg:pb-16">
              <BottleGroup
                sizes={[...new Set([500, 5000, biggest])]}
                liquid={liquid}
                title={`${product.name} in a 500ml bottle, a 5 litre jug and a ${sizeLabel(biggest)} container, drawn to scale`}
              />
            </div>
          </div>
        </div>

        <div className="min-w-0 px-2 py-8 sm:px-8 lg:py-12">
          <div data-reveal>
            <h1 className="text-[length:var(--step-head)]">{product.name}</h1>
            <p className="mt-4 max-w-[46ch]">
              {product.description || "Made by our family in 25-litre batches."}
              {from > 0 && <> From {ksh(from)}, delivered.</>}
            </p>
          </div>

          <section aria-labelledby="buy-title" className="mt-10" data-reveal>
            <h2 id="buy-title" className="mb-4 text-[length:var(--step-lead)]">
              Choose a size
            </h2>
            <ProductBuy
              product={{ id: product.id, slug: product.slug, name: product.name, sizes: product.sizes }}
              initialSize={typeof size === "string" ? Number(size) : undefined}
            />
          </section>

          <section aria-labelledby="all-title" className="mt-24" data-reveal>
            <h2 id="all-title" className="text-[length:var(--step-lead)]">
              All sizes
            </h2>
            <ul className="mt-5 max-w-[26rem] space-y-3 tabular-nums">
              {product.sizes.map((s) => (
                <li key={s.variantId} className="flex items-baseline justify-between gap-6">
                  <span>{sizeLabel(s.sizeMl)}</span>
                  <span>{s.price > 0 ? ksh(s.price) : <span className="text-jw-soft">Soon</span>}</span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="care-title" className="mt-24 max-w-[46ch]" data-reveal>
            <h2 id="care-title" className="text-[length:var(--step-lead)]">
              Use it safely
            </h2>
            <p className="mt-4">
              Keep the bottle closed and out of reach of children. Never mix with other cleaners, especially bleach. If it gets in your eyes,
              rinse with clean water for several minutes.
            </p>
          </section>

          <figure className="mt-24" data-reveal>
            <Image src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} sizes="(min-width: 1024px) 45vw, 100vw" className="h-auto w-full" />
            <figcaption className="mt-3 text-[length:var(--step-small)] text-jw-soft">{photo.caption}</figcaption>
          </figure>

          {others.length > 0 && (
            <section aria-labelledby="more-title" className="mt-24" data-reveal>
              <h2 id="more-title" className="text-[length:var(--step-lead)]">
                Also from JonWin
              </h2>
              <ul className="mt-5 space-y-6">
                {others.map((o) => (
                  <li key={o.id}>
                    <Link href={`/p/${o.slug}`} className="group flex items-end gap-5">
                      <Bottle sizeMl={1000} liquid={liquidFor(o.slug)} fullHeight={170} />
                      <span className="pb-1 text-[length:var(--step-lead)] group-hover:underline group-hover:decoration-2 group-hover:underline-offset-4">
                        {o.name}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </main>
      <ShopFooter />
    </>
  );
}

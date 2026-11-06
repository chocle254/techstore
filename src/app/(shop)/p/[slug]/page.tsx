import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAreas, getCatalog, getRatingSummary } from "@/lib/shop";
import { toGridItems } from "@/lib/shop-grid";
import { ksh, sizeLabel } from "@/lib/format";
import { ShopFooter, ShopHeader } from "@/components/shop/chrome";
import { ProductBuy } from "@/components/shop/product-buy";
import { RelatedProducts } from "@/components/shop/related";
import { Icon } from "@/components/shop/icons";

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
  const [catalog, ratings, areas] = await Promise.all([getCatalog(), getRatingSummary(), getAreas()]);
  const product = catalog.find((p) => p.slug === slug);
  if (!product) notFound();
  const photo = PHOTOS[product.slug] ?? DEFAULT_PHOTO;
  const deliveryFrom = areas.length ? Math.min(...areas.map((a) => a.fee)) : null;
  // For "also from JonWin": one card per other product, its best-value size.
  const related = catalog
    .filter((p) => p.id !== product.id)
    .map((p) => {
      const items = toGridItems([p], ratings);
      return items.find((i) => i.bestValue) ?? items.find((i) => i.price > 0) ?? items[0];
    })
    .filter((i) => i !== undefined);

  return (
    <>
      <ShopHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-3 pt-4 sm:px-4">
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-sm text-jw-soft">
          <Link href="/" className="hover:text-jw-ink">
            Home
          </Link>
          <Icon name="chevron" className="h-3.5 w-3.5 -rotate-90" />
          <Link href="/#shop" className="hover:text-jw-ink">
            Products
          </Link>
          <Icon name="chevron" className="h-3.5 w-3.5 -rotate-90" />
          <span className="truncate font-medium text-jw-ink" aria-current="page">
            {product.name}
          </span>
        </nav>

        <ProductBuy
          product={{ id: product.id, slug: product.slug, name: product.name, sizes: product.sizes }}
          initialSize={typeof size === "string" ? Number(size) : undefined}
          rating={ratings[product.id] ?? null}
          deliveryFrom={deliveryFrom}
        />

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <section className="jw-clay p-6 sm:p-8" aria-labelledby="about-title">
            <h2 id="about-title" className="text-xl">
              About this product
            </h2>
            <p className="mt-3 text-jw-ink/85">{product.description || "Made by our family in 25-litre batches and bottled at home."}</p>
            <h3 className="mt-6 text-base">Use it safely</h3>
            <p className="mt-2 text-sm text-jw-soft">
              Keep the bottle closed and out of reach of children. Never mix with other cleaners, especially bleach. If it gets in your eyes, rinse with clean
              water for several minutes.
            </p>
            <h3 className="mt-6 text-base">Every size</h3>
            <table className="mt-3 w-full text-sm tabular-nums">
              <thead className="text-left text-xs text-jw-soft">
                <tr>
                  <th className="py-2 font-medium">Size</th>
                  <th className="py-2 text-right font-medium">Price</th>
                  <th className="py-2 text-right font-medium">Per litre</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-jw-ink/5">
                {product.sizes.map((s) => (
                  <tr key={s.variantId}>
                    <td className="py-2.5 font-semibold">{sizeLabel(s.sizeMl)}</td>
                    <td className="py-2.5 text-right">{s.price > 0 ? ksh(s.price) : "Soon"}</td>
                    <td className="py-2.5 text-right text-jw-soft">{s.price > 0 ? ksh(Math.round((s.price * 1000) / s.sizeMl)) : "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <figure className="jw-clay self-start overflow-hidden p-2">
            <Image src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} sizes="(min-width: 1024px) 40vw, 100vw" className="h-auto w-full rounded-[1.25rem]" />
            <figcaption className="px-3 py-2 text-xs text-jw-soft">{photo.caption}</figcaption>
          </figure>
        </div>

        {related.length > 0 && (
          <section className="mt-10" aria-labelledby="more-title">
            <h2 id="more-title" className="text-[length:var(--step-head)]">
              Also from JonWin
            </h2>
            <RelatedProducts items={related} />
          </section>
        )}
      </main>
      <ShopFooter credits />
    </>
  );
}

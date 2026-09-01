import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, RotateCcw, Shield, Headphones, ChevronRight, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/common/ProductCard';
import { ProductCardSkeleton } from '@/components/common/SharedComponents';
import { CountdownTimer, useEndOfDayDeadline } from '@/components/common/CountdownTimer';
import { getFeaturedProducts, getCategories, getProducts } from '@/lib/api';
import type { Product, Category } from '@/types/types';

const featureBadges = [
  { icon: Truck, title: 'Free Delivery', sub: 'On orders over $99' },
  { icon: RotateCcw, title: '7 Days Return', sub: 'Easy returns' },
  { icon: Shield, title: 'Secure Payment', sub: '100% secure checkout' },
  { icon: Headphones, title: '24/7 Support', sub: 'Dedicated support' },
];

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [deals, setDeals] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroIdx, setHeroIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const dealsDeadline = useEndOfDayDeadline();

  useEffect(() => {
    Promise.all([
      getFeaturedProducts(6),
      getCategories(),
      getProducts({ isDeal: true, limit: 6 }),
    ]).then(([p, c, d]) => {
      setProducts(p);
      setCategories(c);
      setDeals(d.products);
      setLoading(false);
    });
  }, []);

  const heroSlides = deals.length > 0 ? deals : products;

  useEffect(() => {
    if (heroSlides.length < 2 || paused) return;
    const t = setInterval(() => setHeroIdx(i => (i + 1) % heroSlides.length), 5000);
    return () => clearInterval(t);
  }, [heroSlides.length, paused]);

  const heroProduct = heroSlides[heroIdx];
  const heroDiscount = heroProduct?.original_price && heroProduct.original_price > heroProduct.price
    ? Math.round((1 - heroProduct.price / heroProduct.original_price) * 100)
    : null;

  return (
    <div className="flex flex-col">
      {/* Hero — carousel of hot deals / time-limited offers */}
      <section
        className="relative overflow-hidden min-h-[380px] md:min-h-[460px]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {heroProduct ? (
          <div
            key={heroProduct.id}
            className="absolute inset-0 bg-cover bg-center animate-hero-in"
            style={{ backgroundImage: `url(${heroProduct.image_url})` }}
          />
        ) : (
          <div className="absolute inset-0 bg-cool" />
        )}
        {/* Warm-to-cool sweep, darkest where the copy sits */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/25" />
        <div className="absolute inset-0 opacity-40 mix-blend-overlay bg-spectrum" />

        <div className="relative z-10 flex flex-col justify-center h-full min-h-[380px] md:min-h-[460px] px-6 md:px-10 py-10 max-w-2xl">
          {heroDiscount ? (
            <span className="text-xs font-bold text-white bg-hot rounded-full px-3 py-1 w-fit mb-4 flex items-center gap-1 glow-hot">
              <Flame className="w-3.5 h-3.5" /> {heroDiscount}% OFF · TODAY ONLY
            </span>
          ) : (
            <span className="text-xs font-semibold text-primary bg-primary/10 border border-primary/20 rounded px-2 py-1 w-fit mb-4">
              New Arrival
            </span>
          )}

          <h1 className="text-3xl md:text-5xl font-extrabold text-foreground leading-tight mb-3">
            Technology<br />
            That <span className="text-spectrum">Inspires</span>
          </h1>

          {heroProduct ? (
            <>
              <p className="text-foreground/90 text-base md:text-lg font-medium mb-1 max-w-md line-clamp-1">
                {heroProduct.name}
              </p>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-2xl font-bold text-spectrum">${heroProduct.price.toFixed(2)}</span>
                {heroProduct.original_price && heroProduct.original_price > heroProduct.price && (
                  <span className="text-sm text-muted-foreground line-through">${heroProduct.original_price.toFixed(2)}</span>
                )}
              </div>
            </>
          ) : (
            <p className="text-muted-foreground text-sm md:text-base mb-6 max-w-md">
              Discover the latest tech gadgets and accessories at unbeatable prices.
            </p>
          )}

          {heroDiscount && <CountdownTimer endsAt={dealsDeadline} className="mb-5 w-fit" />}

          <div className="flex items-center gap-3">
            <Button size="lg" className="bg-spectrum border-0 text-white hover:opacity-90" asChild>
              <Link to={heroProduct ? `/product/${heroProduct.slug}` : '/shop'}>Shop Now</Link>
            </Button>
            <Button size="lg" variant="ghost" className="glass gap-1" asChild>
              <Link to="/deals">View Deals <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </div>
        </div>

        {/* Dots */}
        {heroSlides.length > 1 && (
          <div className="absolute bottom-4 left-6 flex gap-2">
            {heroSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => setHeroIdx(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${i === heroIdx ? 'w-6 bg-spectrum' : 'w-1.5 bg-border'}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* Feature badges */}
      <section className="bg-card border-y border-border">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-border">
          {featureBadges.map(b => (
            <div key={b.title} className="flex items-center gap-3 p-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                <b.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{b.title}</p>
                <p className="text-xs text-muted-foreground">{b.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="px-4 md:px-6 py-8 space-y-12">
        {/* Shop By Category — horizontal scroll rail, 6-up */}
        <section>
          <div className="section-header">
            <h2 className="text-xl font-bold text-foreground">Shop By Category</h2>
            <Link to="/shop" className="text-sm text-primary hover:underline font-medium">View All</Link>
          </div>
          <div className="rail">
            {(loading ? Array(8).fill(null) : categories).map((cat, i) =>
              cat ? (
                <Link
                  key={cat.id}
                  to={`/shop?category=${cat.slug}`}
                  className="rail-item group flex flex-col items-center gap-2 w-[104px] sm:w-[120px] lg:w-[calc((100%-3.75rem)/6)] lg:min-w-[130px]"
                >
                  <div className="w-full aspect-square rounded-lg overflow-hidden bg-muted border border-border group-hover:border-primary/50 transition-colors">
                    <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <span className="text-xs font-medium text-center text-foreground group-hover:text-primary transition-colors leading-tight">{cat.name}</span>
                  <span className="text-[10px] text-muted-foreground">{cat.item_count}+ items</span>
                </Link>
              ) : (
                <div key={i} className="rail-item flex flex-col items-center gap-2 w-[104px] sm:w-[120px]">
                  <div className="w-full aspect-square rounded-lg bg-muted animate-pulse" />
                  <div className="h-3 w-12 bg-muted rounded animate-pulse" />
                </div>
              )
            )}
          </div>
        </section>

        {/* Hot Deals — horizontal rail with a shared countdown, warm gradient header */}
        {(loading || deals.length > 0) && (
          <section>
            <div className="section-header">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-1.5">
                  <Flame className="w-5 h-5 text-[hsl(var(--ember))]" /> Hot Deals
                </h2>
                {!loading && <CountdownTimer endsAt={dealsDeadline} compact className="hidden sm:inline-flex" />}
              </div>
              <Link to="/deals" className="text-sm text-primary hover:underline font-medium">View All</Link>
            </div>
            <div className="rail">
              {(loading ? Array(6).fill(null) : deals).map((p, i) =>
                p ? (
                  <div key={p.id} className="rail-item w-[150px] sm:w-[190px] lg:w-[calc((100%-4.5rem)/6)] lg:min-w-[170px]">
                    <ProductCard product={p} />
                  </div>
                ) : (
                  <div key={i} className="rail-item w-[150px] sm:w-[190px]"><ProductCardSkeleton /></div>
                )
              )}
            </div>
          </section>
        )}

        {/* Best Selling Products */}
        <section>
          <div className="section-header">
            <h2 className="text-xl font-bold text-foreground">Best Selling Products</h2>
            <Link to="/shop" className="text-sm text-primary hover:underline font-medium">View All</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {loading
              ? Array(6).fill(null).map((_, i) => <ProductCardSkeleton key={i} />)
              : products.map(p => <ProductCard key={p.id} product={p} />)
            }
          </div>
        </section>

        {/* Promo banner */}
        <section className="relative overflow-hidden rounded-xl glass-strong min-h-[160px]">
          {deals[0] && (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-25"
              style={{ backgroundImage: `url(${deals[0].image_url})` }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
          <div className="relative z-10 flex flex-col justify-center h-full min-h-[160px] px-8 py-8">
            <p className="text-xs font-semibold mb-2 tracking-wide text-spectrum w-fit">Limited Time Offer</p>
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-1">Gaming Week Sale</h3>
            <p className="text-muted-foreground text-sm mb-4">Up to 30% off on gaming laptops, consoles &amp; accessories</p>
            <Button asChild className="w-fit bg-spectrum border-0 text-white hover:opacity-90">
              <Link to="/deals">Shop Deals <ChevronRight className="w-4 h-4 ml-1" /></Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, RotateCcw, Shield, Headphones, ChevronRight, Flame, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/common/ProductCard';
import { ProductCardSkeleton } from '@/components/common/SharedComponents';
import { CountdownTimer } from '@/components/common/CountdownTimer';
import { AdSlot } from '@/components/common/AdSlot';
import { getFeaturedProducts, getCategories, getProducts } from '@/lib/api';
import type { Product, Category } from '@/types/types';

const heroImages = [
  'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_6dc99f9b-d024-470a-97fc-3cf85760db8f.jpg',
  'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_e2d7945b-a4e8-4296-ac08-c747f9557f93.jpg',
  'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_9aaf3a0c-6c76-4434-8d1a-9ae68c132930.jpg',
];

const featureBadges = [
  { icon: Truck, title: 'Free Delivery', sub: 'On orders over $99' },
  { icon: RotateCcw, title: '7 Days Return', sub: 'Easy returns' },
  { icon: Shield, title: 'Secure Payment', sub: '100% secure checkout' },
  { icon: Headphones, title: '24/7 Support', sub: 'Dedicated support' },
];

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [hotDeals, setHotDeals] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dealsLoading, setDealsLoading] = useState(true);
  const [heroIdx, setHeroIdx] = useState(0);

  useEffect(() => {
    Promise.all([getFeaturedProducts(6), getCategories()]).then(([p, c]) => {
      setProducts(p);
      setCategories(c);
      setLoading(false);
    });
    getProducts({ isDeal: true, limit: 8, page: 1 }).then(({ products }) => {
      setHotDeals(products);
      setDealsLoading(false);
    });
    const t = setInterval(() => setHeroIdx(i => (i + 1) % heroImages.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden min-h-[320px] md:min-h-[400px]">
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700"
          style={{ backgroundImage: `url(${heroImages[heroIdx]})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/20" />
        <div className="relative z-10 flex flex-col justify-center h-full min-h-[320px] md:min-h-[400px] px-6 md:px-10 py-10 max-w-2xl">
          <span className="text-xs font-semibold text-primary bg-primary/10 border border-primary/20 rounded px-2 py-1 w-fit mb-4">
            New Arrival
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-foreground leading-tight mb-3">
            Technology<br />
            That <span className="text-primary">Inspires</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-base mb-6 max-w-md">
            Discover the latest tech gadgets and accessories at unbeatable prices.
          </p>
          <div className="flex items-center gap-3">
            <Button size="lg" asChild>
              <Link to="/shop">Shop Now</Link>
            </Button>
            <Button size="lg" variant="ghost" className="border border-border gap-1" asChild>
              <Link to="/deals">View Deals <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </div>
        </div>
        {/* Dots */}
        <div className="absolute bottom-4 left-6 flex gap-2">
          {heroImages.map((_, i) => (
            <button
              key={i}
              onClick={() => setHeroIdx(i)}
              className={`w-2 h-2 rounded-full transition-colors ${i === heroIdx ? 'bg-primary' : 'bg-border'}`}
            />
          ))}
        </div>
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
        {/* Shop By Category */}
        <section>
          <div className="section-header">
            <h2 className="text-xl font-bold text-foreground">Shop By Category</h2>
            <Link to="/shop" className="text-sm text-primary hover:underline font-medium">View All</Link>
          </div>
          <div className="flex md:grid md:grid-cols-8 gap-3 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0 pb-1 md:pb-0">
            {(loading ? Array(8).fill(null) : categories.slice(0, 8)).map((cat, i) =>
              cat ? (
                <Link
                  key={cat.id}
                  to={`/shop?category=${cat.slug}`}
                  className="flex flex-col items-center gap-2 group shrink-0 w-20 md:w-auto snap-start"
                >
                  <div className="w-full aspect-square rounded-lg overflow-hidden bg-muted border border-border group-hover:border-primary/50 transition-colors">
                    <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <span className="text-xs font-medium text-center text-foreground group-hover:text-primary transition-colors leading-tight">{cat.name}</span>
                  <span className="text-[10px] text-muted-foreground">{cat.item_count}+ items</span>
                </Link>
              ) : (
                <div key={i} className="flex flex-col items-center gap-2 shrink-0 w-20 md:w-auto">
                  <div className="w-full aspect-square rounded-lg bg-muted animate-pulse" />
                  <div className="h-3 w-12 bg-muted rounded animate-pulse" />
                </div>
              )
            )}
          </div>
        </section>

        {/* Limited Time Offer — countdown banner */}
        <section className="relative overflow-hidden rounded-xl min-h-[180px] animated-gradient">
          <div className="absolute inset-0 bg-black/10" />
          <div
            className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-60"
            style={{ backgroundImage: `url(https://miaoda-site-img.s3cdn.medo.dev/images/KLing_9aaf3a0c-6c76-4434-8d1a-9ae68c132930.jpg)` }}
          />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 h-full min-h-[180px] px-6 md:px-8 py-8">
            <div>
              <p className="text-xs text-white/90 font-bold mb-2 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 animate-flicker" /> Limited Time Offer
              </p>
              <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-1 drop-shadow">Gaming Week Sale</h3>
              <p className="text-white/90 text-sm mb-4 max-w-sm">Up to 30% off on gaming laptops, consoles & accessories — ends tonight</p>
              <Button asChild variant="secondary" className="w-fit bg-white text-foreground hover:bg-white/90">
                <Link to="/deals">Shop Deals <ChevronRight className="w-4 h-4 ml-1" /></Link>
              </Button>
            </div>
            <CountdownTimer className="shrink-0" variant="on-gradient" />
          </div>
        </section>

        {/* Hot Deals */}
        {(dealsLoading || hotDeals.length > 0) && (
          <section>
            <div className="section-header">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="w-9 h-9 rounded-lg bg-gradient-hot flex items-center justify-center animate-pulse-glow shrink-0">
                  <Flame className="w-5 h-5 text-white" />
                </span>
                <span className="gradient-text-hot">Hot Deals</span>
              </h2>
              <Link to="/deals" className="text-sm text-primary hover:underline font-medium">View All</Link>
            </div>
            <div className="flex md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0 pb-2 md:pb-0">
              {dealsLoading
                ? Array(6).fill(null).map((_, i) => (
                    <div key={i} className="shrink-0 w-40 md:w-auto snap-start"><ProductCardSkeleton /></div>
                  ))
                : hotDeals.map(p => (
                    <div key={p.id} className="shrink-0 w-40 md:w-auto snap-start">
                      <ProductCard product={p} />
                    </div>
                  ))
              }
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

        {/* Ad slot — sits between organic sections, clearly labeled, reserved height */}
        <AdSlot height={100} />
      </div>
    </div>
  );
}

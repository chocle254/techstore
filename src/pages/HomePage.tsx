import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, RotateCcw, Shield, Headphones, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/common/ProductCard';
import { ProductCardSkeleton } from '@/components/common/SharedComponents';
import { getFeaturedProducts, getCategories } from '@/lib/api';
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroIdx, setHeroIdx] = useState(0);

  useEffect(() => {
    Promise.all([getFeaturedProducts(6), getCategories()]).then(([p, c]) => {
      setProducts(p);
      setCategories(c);
      setLoading(false);
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
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            {(loading ? Array(8).fill(null) : categories.slice(0, 8)).map((cat, i) =>
              cat ? (
                <Link
                  key={cat.id}
                  to={`/shop?category=${cat.slug}`}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="w-full aspect-square rounded-lg overflow-hidden bg-muted border border-border group-hover:border-primary/50 transition-colors">
                    <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <span className="text-xs font-medium text-center text-foreground group-hover:text-primary transition-colors leading-tight">{cat.name}</span>
                  <span className="text-[10px] text-muted-foreground">{cat.item_count}+ items</span>
                </Link>
              ) : (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="w-full aspect-square rounded-lg bg-muted animate-pulse" />
                  <div className="h-3 w-12 bg-muted rounded animate-pulse" />
                </div>
              )
            )}
          </div>
        </section>

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
        <section className="relative overflow-hidden rounded-xl bg-card border border-border min-h-[160px]">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{ backgroundImage: `url(https://miaoda-site-img.s3cdn.medo.dev/images/KLing_9aaf3a0c-6c76-4434-8d1a-9ae68c132930.jpg)` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background to-transparent" />
          <div className="relative z-10 flex flex-col justify-center h-full min-h-[160px] px-8 py-8">
            <p className="text-xs text-primary font-semibold mb-2 uppercase tracking-wider">Limited Time Offer</p>
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-1">Gaming Week Sale</h3>
            <p className="text-muted-foreground text-sm mb-4">Up to 30% off on gaming laptops, consoles & accessories</p>
            <Button asChild className="w-fit">
              <Link to="/deals">Shop Deals <ChevronRight className="w-4 h-4 ml-1" /></Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

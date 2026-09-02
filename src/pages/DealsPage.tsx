import React, { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';
import { getProducts } from '@/lib/api';
import { ProductCard } from '@/components/common/ProductCard';
import { ProductCardSkeleton } from '@/components/common/SharedComponents';
import { CountdownTimer } from '@/components/common/CountdownTimer';
import { AdSlot } from '@/components/common/AdSlot';
import type { Product } from '@/types/types';

export default function DealsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProducts({ isDeal: true, limit: 24, page: 1 }).then(({ products }) => {
      setProducts(products);
      setLoading(false);
    });
  }, []);

  return (
    <div className="p-4 md:p-6">
      {/* Hero banner */}
      <div className="relative rounded-xl overflow-hidden mb-8 min-h-[160px] animated-gradient">
        <div className="absolute inset-0 bg-black/15" />
        <div
          className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-50"
          style={{ backgroundImage: `url(https://miaoda-site-img.s3cdn.medo.dev/images/KLing_6dc99f9b-d024-470a-97fc-3cf85760db8f.jpg)` }}
        />
        <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-white bg-white/20 border border-white/30 rounded px-2 py-1 mb-3 inline-flex items-center gap-1.5 backdrop-blur-sm">
              <Flame className="w-3.5 h-3.5 animate-pulse" /> Limited Time Deals
            </span>
            <h1 className="text-3xl font-extrabold text-white drop-shadow">Today's Best Deals</h1>
            <p className="text-white/90 mt-2">Massive discounts on the latest tech. Don't miss out!</p>
          </div>
          <CountdownTimer variant="on-gradient" className="shrink-0" />
        </div>
      </div>

      <AdSlot height={90} className="mb-8" />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {loading
          ? Array(8).fill(null).map((_, i) => <ProductCardSkeleton key={i} />)
          : products.map(p => <ProductCard key={p.id} product={p} />)
        }
      </div>
    </div>
  );
}

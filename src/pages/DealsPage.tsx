import React, { useEffect, useState } from 'react';
import { getProducts } from '@/lib/api';
import { ProductCard } from '@/components/common/ProductCard';
import { ProductCardSkeleton } from '@/components/common/SharedComponents';
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
      <div className="relative rounded-xl overflow-hidden bg-card border border-border mb-8 min-h-[140px]">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(https://miaoda-site-img.s3cdn.medo.dev/images/KLing_6dc99f9b-d024-470a-97fc-3cf85760db8f.jpg)` }}
        />
        <div className="relative z-10 p-8">
          <span className="text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded px-2 py-1 mb-3 inline-block">
            🔥 Limited Time Deals
          </span>
          <h1 className="text-3xl font-extrabold text-foreground">Today's Best Deals</h1>
          <p className="text-muted-foreground mt-2">Massive discounts on the latest tech. Don't miss out!</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {loading
          ? Array(8).fill(null).map((_, i) => <ProductCardSkeleton key={i} />)
          : products.map(p => <ProductCard key={p.id} product={p} />)
        }
      </div>
    </div>
  );
}

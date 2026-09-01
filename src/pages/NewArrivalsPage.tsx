import React, { useEffect, useState } from 'react';
import { getProducts } from '@/lib/api';
import { ProductCard } from '@/components/common/ProductCard';
import { ProductCardSkeleton } from '@/components/common/SharedComponents';
import type { Product } from '@/types/types';

export default function NewArrivalsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProducts({ isNew: true, sortBy: 'newest', limit: 24, page: 1 }).then(({ products }) => {
      setProducts(products);
      setLoading(false);
    });
  }, []);

  return (
    <div className="p-4 md:p-6">
      <div className="mb-8">
        <span className="text-xs font-semibold text-primary bg-primary/10 border border-primary/20 rounded px-2 py-1 mb-3 inline-block">
          ✨ Just Arrived
        </span>
        <h1 className="text-3xl font-extrabold text-foreground">New Arrivals</h1>
        <p className="text-muted-foreground mt-2">The latest tech products fresh off the shelf.</p>
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

import React from 'react';
import { ProductCard } from './ProductCard';
import { ProductCardSkeleton } from './SharedComponents';
import type { Product } from '@/types/types';

interface YouMayAlsoLikeProps {
  products: Product[];
  loading?: boolean;
  title?: string;
}

export function YouMayAlsoLike({ products, loading, title = 'You May Also Like' }: YouMayAlsoLikeProps) {
  if (!loading && products.length === 0) return null;

  return (
    <section>
      <h2 className="text-xl font-bold text-foreground mb-4">{title}</h2>
      {/* Horizontally scrollable rail on phone, grid from tablet up */}
      <div className="flex md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 overflow-x-auto md:overflow-visible snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0 pb-2 md:pb-0">
        {loading
          ? Array(6).fill(null).map((_, i) => (
              <div key={i} className="shrink-0 w-40 md:w-auto snap-start">
                <ProductCardSkeleton />
              </div>
            ))
          : products.map(p => (
              <div key={p.id} className="shrink-0 w-40 md:w-auto snap-start">
                <ProductCard product={p} />
              </div>
            ))
        }
      </div>
    </section>
  );
}

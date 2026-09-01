import React, { useEffect, useState } from 'react';
import { ShoppingCart, Heart, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ProductCard } from '@/components/common/ProductCard';
import { EmptyState, ProductCardSkeleton } from '@/components/common/SharedComponents';
import { useWishlist } from '@/contexts/WishlistContext';

export default function WishlistPage() {
  const { items, toggleWishlist, loading } = useWishlist();

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold text-foreground mb-6">My Wishlist ({items.length})</h1>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array(4).fill(null).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Heart className="w-16 h-16" />}
          title="Your wishlist is empty"
          description="Save items you love to your wishlist and find them here anytime."
          action={<Button asChild><Link to="/shop">Browse Products</Link></Button>}
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map(item =>
            item.product ? <ProductCard key={item.id} product={item.product} /> : null
          )}
        </div>
      )}
    </div>
  );
}
